import { action, observable } from "mobx"
import { useState } from "react"
import { isPlainObject } from "./utils"

export function useLocalStore<T>(initializer: () => T): T {
    return useState(() => {
        const store: any = observable(initializer())
        if (isPlainObject(store)) {
            Object.keys(store).forEach(key => {
                const value = store[key]
                if (typeof value === "function") {
                    store[key] = action(value.bind(store))
                }
            })
        }
        return store
    })[0]
}
