module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    setupTestFrameworkScriptFile: require.resolve("./jest.setup.js"),
    verbose: false,
    coverageDirectory: "coverage"
}
