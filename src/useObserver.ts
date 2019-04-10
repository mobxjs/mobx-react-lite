import { Reaction } from "mobx"
import { useDebugValue, useEffect, useRef } from "react"
import { printDebugValue } from "./printDebugValue"
import { isUsingStaticRendering } from "./staticRendering"
import { useForceUpdate } from "./utils"

export type ForceUpdateHook = () => () => void

export interface IUseObserverOptions {
    useForceUpdate?: ForceUpdateHook
}

const EMPTY_OBJECT = {}

function observerComponentNameFor(baseComponentName: string) {
    return `observer${baseComponentName}`
}

export function useObserver<T>(
    fn: () => T,
    baseComponentName: string = "observed",
    options: IUseObserverOptions = EMPTY_OBJECT
): T {
    if (isUsingStaticRendering()) {
        return fn()
    }

    const wantedForceUpdateHook = options.useForceUpdate || useForceUpdate
    const forceUpdate = wantedForceUpdateHook()

    // StrictMode/ConcurrentMode/Suspense may mean that our component is
    // rendered and abandoned multiple times, so we need to track leaked
    // Reactions.
    const reactionTrackingRef = useRef<IReactionTracking | null>(null)

    if (!reactionTrackingRef.current) {
        // First render for this component (or first time since a previous
        // reaction from an abandoned render was disposed).
        const trackingData: IReactionTracking = {
            cleanAt: Date.now() + CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS,
            reaction: new Reaction(observerComponentNameFor(baseComponentName), () => {
                // Observable has changed, meaning we want to re-render
                // BUT if we're a component that hasn't yet got to the useEffect()
                // stage, we might be a component that _started_ to render, but
                // got dropped, and we don't want to make state changes then.
                // (It triggers warnings in StrictMode, for a start.)
                if (trackingData.mounted) {
                    // We have reached useEffect(), so we're mounted, and can trigger an update
                    forceUpdate()
                } else {
                    // We haven't yet reached useEffect(), so we'll need to trigger a re-render
                    // when (and if) useEffect() arrives.  The easiest way to do that is just to
                    // drop our current reaction and allow useEffect() to recreate it.
                    trackingData.reaction.dispose()
                    reactionTrackingRef.current = null
                }
            })
        }

        reactionTrackingRef.current = trackingData
        scheduleCleanupOfReactionIfLeaked(reactionTrackingRef)
    }

    const reaction = reactionTrackingRef.current!.reaction
    useDebugValue(reaction, printDebugValue)

    useEffect(() => {
        // Called on first mount only
        recordReactionAsCommitted(reactionTrackingRef)

        if (reactionTrackingRef.current) {
            // Great. We've already got our reaction from our render;
            // all we need to do is to record that it's now mounted,
            // to allow future observable changes to trigger re-renders
            reactionTrackingRef.current.mounted = true
        } else {
            // The reaction we set up in our render has been disposed.
            // This is either due to bad timings of renderings, e.g. our
            // component was paused for a _very_ long time, and our
            // reaction got cleaned up, or we got a observable change
            // between render and useEffect

            // Re-create the reaction
            reactionTrackingRef.current = {
                reaction: new Reaction(observerComponentNameFor(baseComponentName), () => {
                    // We've definitely already been mounted at this point
                    forceUpdate()
                }),
                cleanAt: Infinity
            }
            forceUpdate()
        }

        return () => reactionTrackingRef.current!.reaction.dispose()
    }, [])

    // render the original component, but have the
    // reaction track the observables, so that rendering
    // can be invalidated (see above) once a dependency changes
    let rendering!: T
    let exception
    reaction.track(() => {
        try {
            rendering = fn()
        } catch (e) {
            exception = e
        }
    })
    if (exception) {
        throw exception // re-throw any exceptions catched during rendering
    }
    return rendering
}

// Reaction cleanup tracking.

interface IReactionTracking {
    /** The Reaction created during first render, which may be leaked */
    reaction: Reaction
    /**
     * The time (in ticks) at which point we should dispose of the reaction
     * if this component hasn't yet been fully mounted.
     */
    cleanAt: number

    /**
     * Whether the component has yet completed mounting (for us, whether
     * its useEffect has run)
     */
    mounted?: boolean

    /**
     * Whether the observables that the component is tracking changed between
     * the first render and the first useEffect.
     */
    changedBeforeMount?: boolean
}

/**
 * The minimum time before we'll clean up a Reaction created in a render
 * for a component that hasn't managed to run its effects. This needs to
 * be big enough to ensure that a component won't turn up and have its
 * effects run without being re-rendered.
 */
export const CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS = 10_000

/**
 * The frequency with which we'll check for leaked reactions.
 */
export const CLEANUP_TIMER_LOOP_MILLIS = 10_000

/**
 * Reactions created by components that have yet to be fully mounted.
 */
const uncommittedReactionRefs: Set<React.MutableRefObject<IReactionTracking | null>> = new Set()

/**
 * Latest 'uncommitted reactions' cleanup timer handle.
 */
let reactionCleanupHandle: ReturnType<typeof setTimeout> | undefined

function ensureCleanupTimerRunning() {
    if (reactionCleanupHandle === undefined) {
        reactionCleanupHandle = setTimeout(cleanUncommittedReactions, CLEANUP_TIMER_LOOP_MILLIS)
    }
}

function scheduleCleanupOfReactionIfLeaked(ref: React.MutableRefObject<IReactionTracking | null>) {
    uncommittedReactionRefs.add(ref)

    ensureCleanupTimerRunning()
}

function recordReactionAsCommitted(reactionRef: React.MutableRefObject<IReactionTracking | null>) {
    uncommittedReactionRefs.delete(reactionRef)
}

/**
 * Run by the cleanup timer to dispose any outstanding reactions
 */
function cleanUncommittedReactions() {
    reactionCleanupHandle = undefined

    // Loop through all the candidate leaked reactions; those older
    // than CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS get tidied.

    const now = Date.now()
    for (const ref of uncommittedReactionRefs) {
        const tracking = ref.current
        if (tracking) {
            if (now >= tracking.cleanAt) {
                // It's time to tidy up this leaked reaction.
                tracking.reaction.dispose()
                ref.current = null
                uncommittedReactionRefs.delete(ref)
            }
        }
    }

    if (uncommittedReactionRefs.size > 0) {
        // We've just finished a round of cleanups but there are still
        // some leak candidates outstanding.
        ensureCleanupTimerRunning()
    }
}

/* istanbul ignore next */
/**
 * Only to be used by test functions; do not export outside of mobx-react-lite
 */
export function forceCleanupTimerToRunNowForTests() {
    // This allows us to control the execution of the cleanup timer
    // to force it to run at awkward times in unit tests.
    if (reactionCleanupHandle) {
        clearTimeout(reactionCleanupHandle)
        cleanUncommittedReactions()
    }
}

/* istanbul ignore next */
export function resetCleanupScheduleForTests() {
    if (reactionCleanupHandle) {
        clearTimeout(reactionCleanupHandle)
        reactionCleanupHandle = undefined
    }
    uncommittedReactionRefs.clear()
}
