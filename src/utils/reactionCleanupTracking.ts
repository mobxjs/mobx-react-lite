import { Reaction } from "mobx"

export interface IReactionTracking {
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
    mounted: boolean

    /**
     * Whether the observables that the component is tracking changed between
     * the first render and the first useEffect.
     */
    changedBeforeMount: boolean
}

export function createTrackingData(reaction: Reaction) {
    const trackingData: IReactionTracking = {
        reaction,
        mounted: false,
        changedBeforeMount: false,
        cleanAt: Date.now() + CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS
    }
    return trackingData
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

export function scheduleCleanupOfReactionIfLeaked(
    ref: React.MutableRefObject<IReactionTracking | null>
) {
    uncommittedReactionRefs.add(ref)

    ensureCleanupTimerRunning()
}

export function recordReactionAsCommitted(
    reactionRef: React.MutableRefObject<IReactionTracking | null>
) {
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
    uncommittedReactionRefs.forEach(ref => {
        const tracking = ref.current
        if (tracking) {
            if (now >= tracking.cleanAt) {
                // It's time to tidy up this leaked reaction.
                tracking.reaction.dispose()
                ref.current = null
                uncommittedReactionRefs.delete(ref)
            }
        }
    })

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
    if (uncommittedReactionRefs.size > 0) {
        for (const ref of uncommittedReactionRefs) {
            const tracking = ref.current
            if (tracking) {
                tracking.reaction.dispose()
                ref.current = null
            }
        }
        uncommittedReactionRefs.clear()
    }

    if (reactionCleanupHandle) {
        clearTimeout(reactionCleanupHandle)
        reactionCleanupHandle = undefined
    }
}
