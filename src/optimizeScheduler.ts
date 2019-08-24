import { configure } from "mobx"
import { unstable_batchedUpdates } from "react-dom"

export const optimizeScheduler = (reactionScheduler: typeof unstable_batchedUpdates) => {
    if (typeof reactionScheduler === "function") {
        configure({ reactionScheduler })
    }
}

export const deoptimizeScheduler = () => {
    configure({ reactionScheduler: undefined })
}
