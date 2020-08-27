import { configure } from "mobx"

export function defaulNoopBatch(callback: () => void) {
    callback()
}

export function observerBatching(reactionScheduler: any) {
    if (!reactionScheduler) {
        reactionScheduler = defaulNoopBatch
        if ("production" !== process.env.NODE_ENV) {
            console.warn(
                "[MobX] Failed to get unstable_batched updates from react-dom / react-native"
            )
        }
    }
    configure({ reactionScheduler })
}
