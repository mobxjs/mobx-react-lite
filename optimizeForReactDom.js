const ReactDOM = require("react-dom")
require("./dist").optimizeScheduler(ReactDOM.unstable_batchedUpdates)
