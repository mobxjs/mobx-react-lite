import { Reaction } from "mobx"
import React from "react"

import { printDebugValue } from "./printDebugValue"
import {
    createTrackingData,
    IReactionTracking,
    recordReactionAsCommitted,
    scheduleCleanupOfReactionIfLeaked
} from "./reactionCleanupTracking"
import { isUsingStaticRendering } from "./staticRendering"
import { useForceUpdate } from "./utils"
import { useQueuedForceUpdate, useQueuedForceUpdateBlock } from "./useQueuedForceUpdate"

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
    const queuedForceUpdate = useQueuedForceUpdate(forceUpdate)

    // StrictMode/ConcurrentMode/Suspense may mean that our component is
    // rendered and abandoned multiple times, so we need to track leaked
    // Reactions.
    const reactionTrackingRef = React.useRef<IReactionTracking | null>(null)

    if (!reactionTrackingRef.current) {
        // First render for this component (or first time since a previous
        // reaction from an abandoned render was disposed).

        const newReaction = new Reaction(observerComponentNameFor(baseComponentName), () => {
            // Observable has changed, meaning we want to re-render
            // BUT if we're a component that hasn't yet got to the useEffect()
            // stage, we might be a component that _started_ to render, but
            // got dropped, and we don't want to make state changes then.
            // (It triggers warnings in StrictMode, for a start.)
            if (trackingData.mounted) {
                // We have reached useEffect(), so we're mounted, and can trigger an update
                queuedForceUpdate()
            } else {
                // We haven't yet reached useEffect(), so we'll need to trigger a re-render
                // when (and if) useEffect() arrives.  The easiest way to do that is just to
                // drop our current reaction and allow useEffect() to recreate it.
                newReaction.dispose()
                reactionTrackingRef.current = null
            }
        })

        const trackingData = createTrackingData(newReaction)
        reactionTrackingRef.current = trackingData
        scheduleCleanupOfReactionIfLeaked(reactionTrackingRef)
    }

    const { reaction } = reactionTrackingRef.current!
    React.useDebugValue(reaction, printDebugValue)

    React.useEffect(() => {
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
                    queuedForceUpdate()
                }),
                cleanAt: Infinity
            }
            queuedForceUpdate()
        }

        return () => {
            reactionTrackingRef.current!.reaction.dispose()
            reactionTrackingRef.current = null
        }
    }, [])

    // delay all force-update calls after rendering of this component
    return useQueuedForceUpdateBlock(() => {
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
            throw exception // re-throw any exceptions caught during rendering
        }

        return rendering
    })
}
