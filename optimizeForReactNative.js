const ReactNative = require("react-native")
require("./dist").optimizeScheduler(ReactNative.unstable_batchedUpdates)
