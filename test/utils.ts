import { configure } from "mobx"

export function resetMobx(): void {
    configure({ enforceActions: "never" })
}

declare namespace global {
    let __DEV__: boolean
}
export function enableDevEnvironment() {
    process.env.NODE_ENV === "development"
    return function() {
        process.env.NODE_ENV === "production"
    }
}
