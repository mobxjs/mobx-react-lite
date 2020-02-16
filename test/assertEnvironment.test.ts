afterEach(() => {
    jest.resetModules()
    jest.resetAllMocks()
})

it("throws if react is not installed", () => {
    jest.mock("react", () => ({}))
    expect(() => require("../src/assertEnvironment.ts")).toThrowErrorMatchingInlineSnapshot(
        `"mobx-react-lite requires React with Hooks support"`
    )
})

it("throws if mobx is not installed", () => {
    jest.mock("react", () => ({ useState: true }))
    jest.mock("mobx", () => ({}))
    expect(() => require("../src/assertEnvironment.ts")).toThrowErrorMatchingInlineSnapshot(
        `"mobx-react-lite requires mobx at least version 4 to be available"`
    )
})
