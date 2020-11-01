module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: [require.resolve("./jest.setup.js")],
    verbose: false,
    coverageDirectory: "coverage",
    globals: {
        "ts-jest": {
            diagnostics: false
        }
    }
}
