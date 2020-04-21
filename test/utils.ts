import { configure } from "mobx"

export function resetMobx(): void {
    configure({ enforceActions: "never" })
}

declare namespace global {
    let __DEV__: boolean
}
export function enableDevEnvironment() {
    global.__DEV__ = true
    return function() {
        global.__DEV__ = false
    }
}
