import { configure } from "mobx"
import { getGlobal, getSymbol } from "./utils"

const observerBatchingConfiguredSymbol = getSymbol("observerBatching")

export function defaultNoopBatch(callback: () => void) {
    callback()
}

export function observerBatching(reactionScheduler: any) {
    if (!reactionScheduler) {
        reactionScheduler = defaultNoopBatch
        if ("production" !== process.env.NODE_ENV) {
            console.warn(
                "[MobX] Failed to get unstable_batched updates from react-dom / react-native"
            )
        }
    }
    configure({ reactionScheduler })
    getGlobal()[observerBatchingConfiguredSymbol] = true
}

export const isObserverBatched = () => !!getGlobal()[observerBatchingConfiguredSymbol]
