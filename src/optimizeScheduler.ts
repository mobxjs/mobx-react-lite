import { configure } from "mobx"

export interface IBatchedUpdates {
    batchedUpdates<A, B>(callback: (a: A, b: B) => any, a: A, b: B): void
    batchedUpdates<A>(callback: (a: A) => any, a: A): void
    batchedUpdates(callback: () => any): void
}

export const optimizeScheduler = (reactionScheduler: IBatchedUpdates) => {
    if (typeof reactionScheduler === "function") {
        configure({ reactionScheduler })
    }
}

export const deoptimizeScheduler = () => {
    configure({ reactionScheduler: undefined })
}
