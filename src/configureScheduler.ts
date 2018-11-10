import { configure } from "mobx"

try {
    configureDOM()
    configureNative()
} catch (err) {
    // safe to ignore here?
}

function configureDOM() {
    const { unstable_batchedUpdates } = require("react-dom")
    configure({ reactionScheduler: unstable_batchedUpdates })
}

function configureNative() {
    const { unstable_batchedUpdates } = require("react-native")
    configure({ reactionScheduler: unstable_batchedUpdates })
}
