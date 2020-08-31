import React from "react"

export type ForceUpdate = () => void

let insideRender: boolean = false
let forceUpdateQueue: ForceUpdate[] = []

export function useQueuedForceUpdate(forceUpdate: ForceUpdate): ForceUpdate {
    return () => {
        if (insideRender) {
            forceUpdateQueue.push(forceUpdate)
        } else {
            forceUpdate()
        }
    }
}

export function useQueuedForceUpdateBlock<T>(callback: () => T) {
    // start intercepting force-update calls
    insideRender = true
    forceUpdateQueue = []
    try {
        const result = callback()

        // stop intercepting force-update
        insideRender = false
        // store queue or nothing if it was empty to execute useLayoutEffect only when necessary
        const queue = forceUpdateQueue.length > 0 ? forceUpdateQueue : undefined

        // run force-update queue in useLayoutEffect
        React.useLayoutEffect(() => {
            if (queue) {
                queue.forEach(x => x())
            }
        }, [queue])

        return result
    } finally {
        insideRender = false
    }
}
