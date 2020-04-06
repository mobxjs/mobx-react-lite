import { configure } from "mobx"

interface IBatchedUpdates {
    batchedUpdates<A, B>(callback: (a: A, b: B) => any, a: A, b: B): void
    batchedUpdates<A>(callback: (a: A) => any, a: A): void
    batchedUpdates(callback: () => any): void
}

let observerBatchingConfigured = false

export const observerBatching = (reactionScheduler?: IBatchedUpdates) => {
    if (typeof reactionScheduler === "function") {
        configure({ reactionScheduler })
    }
    observerBatchingConfigured = true
}

export const observerBatchingOptOut = () => {
    configure({ reactionScheduler: undefined })
    observerBatchingConfigured = true
}

export const isObserverBatched = () => observerBatchingConfigured
