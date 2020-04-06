import { configure } from "mobx"

import { getGlobal, getSymbol } from "./utils"

interface IBatchedUpdates {
    batchedUpdates<A, B>(callback: (a: A, b: B) => any, a: A, b: B): void
    batchedUpdates<A>(callback: (a: A) => any, a: A): void
    batchedUpdates(callback: () => any): void
}

const observerBatchingConfiguredSymbol = getSymbol("observerBatching")

export const observerBatching = (reactionScheduler?: IBatchedUpdates) => {
    if (typeof reactionScheduler === "function") {
        configure({ reactionScheduler })
    }
    getGlobal()[observerBatchingConfiguredSymbol] = true
}

export const observerBatchingOptOut = () => {
    configure({ reactionScheduler: undefined })
    getGlobal()[observerBatchingConfiguredSymbol] = true
}

export const isObserverBatched = () => getGlobal()[observerBatchingConfiguredSymbol]
