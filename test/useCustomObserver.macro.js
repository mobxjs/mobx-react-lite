const { createUseObserver } = require("../src/macro/createUseObserver")
const path = require("path")
module.exports = createUseObserver({
    importSource: path.resolve(__dirname, "./useCustomObserver"),
    importSpecifier: "useCustomObserver"
})
