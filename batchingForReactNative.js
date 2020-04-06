const ReactNative = require("react-native")
require("./dist").observerBatching(ReactNative.unstable_batchedUpdates)
