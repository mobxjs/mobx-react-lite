const { createUseObserver } = require("./createUseObserver")
const path = require("path")
module.exports = createUseObserver({
    importSource: "mobx-react-lite",
    importSpecifier: "useObserver"
})
