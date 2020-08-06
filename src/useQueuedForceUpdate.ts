export type ForceUpdate = () => void

let insideRender: boolean = false
let forceUpdateQueue: ForceUpdate[] = []

export function startForceUpdateQueueing(): void {
    insideRender = true
    forceUpdateQueue = []
}

export function useQueuedForceUpdate(forceUpdate: ForceUpdate): ForceUpdate {
    return () => {
        if (insideRender) {
            forceUpdateQueue.push(forceUpdate)
        } else {
            forceUpdate()
        }
    }
}

export function stopForceUpdateQueueing(): undefined | ForceUpdate[] {
    insideRender = false
    return forceUpdateQueue.length > 0 ? forceUpdateQueue : undefined
}
