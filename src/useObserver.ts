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

    const reaction = useRef<Reaction | null>(null)
    const committed = useRef(false)

    if (!reaction.current) {
        // First render for this component. Not yet committed.
        reaction.current = new Reaction(`observer(${baseComponentName})`, () => {
            // Observable has changed. Only force an update if we've definitely
            // been committed.
            if (committed.current) {
                forceUpdate()
            }
        })
        scheduleCleanupOfReactionIfNotCommitted(reaction.current)
    }

    useDebugValue(reaction, printDebugValue)

    useEffect(() => {
        recordReactionAsCommitted(reaction.current!)
        committed.current = true
        return () => reaction.current!.dispose()
    }, [])

    // render the original component, but have the
    // reaction track the observables, so that rendering
    // can be invalidated (see above) once a dependency changes
    let rendering!: T
    let exception
    reaction.current.track(() => {
        try {
            rendering = fn()
        } catch (e) {
            exception = e
        }
    })
    if (exception) {
        reaction.current.dispose()
        throw exception // re-throw any exceptions catched during rendering
    }
    return rendering
}

/**
 * Reactions created by components that have yet to be committed.
 */
const uncommittedReactions: Reaction[] = []

/**
 * Latest 'uncommitted reactions' cleanup timer handle
 */
let reactionCleanupHandle: number | undefined

function scheduleCleanupOfReactionIfNotCommitted(reaction: Reaction) {
    uncommittedReactions.push(reaction)
    if (reactionCleanupHandle) {
        window.clearTimeout(reactionCleanupHandle)
    }
    // We currently have no cleanup timer running; schedule one
    reactionCleanupHandle = window.setTimeout(cleanUncommittedReactions, 100)
}

function recordReactionAsCommitted(reaction: Reaction) {
    // It would be more efficient if we could use a Set instead of an Array,
    // but mobx-react-lite currently supports MobX 4 and ES5, so we can't assume
    // the presence of Set.
    const i = uncommittedReactions.indexOf(reaction)
    if (i) {
        uncommittedReactions.splice(i, 1)
    }
}

/**
 * Run by the cleanup timer to dispose any outstanding reactions
 */
function cleanUncommittedReactions() {
    reactionCleanupHandle = undefined

    while (uncommittedReactions.length) {
        uncommittedReactions.pop()!.dispose()
    }
}

/**
 * Only to be used by test functions; do not export outside of mobx-react-lite
 */
export function forceCleanupTimerToRunNowForTests() {
    // This allows us to control the execution of the cleanup timer
    // to force it to run at awkward times in unit tests.
    if (reactionCleanupHandle) {
        clearTimeout(reactionCleanupHandle)
        reactionCleanupHandle = undefined
        cleanUncommittedReactions()
    }
}

export function resetCleanupScheduleForTests() {
    if (reactionCleanupHandle) {
        clearTimeout(reactionCleanupHandle)
        reactionCleanupHandle = undefined
    }
    uncommittedReactions.length = 0
}
