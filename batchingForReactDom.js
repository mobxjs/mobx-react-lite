const ReactDOM = require("react-dom")
require("./dist").observerBatching(ReactDOM.unstable_batchedUpdates)
