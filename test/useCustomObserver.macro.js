const { createUseObserverMacro } = require("../src/macro/createUseObserverMacro")
const path = require("path")
module.exports = createUseObserverMacro({
    importSource: path.resolve(__dirname, "./useCustomObserver"),
    importSpecifier: "useCustomObserver"
})
