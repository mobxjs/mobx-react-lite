const { unstable_batchedUpdates } = require("react-native")
require("./dist").optimizeScheduler(unstable_batchedUpdates)
