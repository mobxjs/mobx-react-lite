const { unstable_batchedUpdates } = require("react-dom")
require("./dist").optimizeScheduler(unstable_batchedUpdates)
