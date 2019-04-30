import { observable, transaction } from "mobx"
import { useState } from "react"
import { isPlainObject } from "./utils"

// tslint:disable-next-line: ban-types
function wrapInTransaction(fn: Function) {
    // tslint:disable-next-line: only-arrow-functions
    return function() {
        const args = arguments
        return transaction(() => fn.apply(null, args))
    }
}

export function useLocalStore<T>(initializer: () => T): T {
    return useState(() => {
        const store: any = observable(initializer())
        if (isPlainObject(store)) {
            Object.keys(store).forEach(key => {
                const value = store[key]
                if (typeof value === "function") {
                    store[key] = wrapInTransaction(value.bind(store))
                }
            })
        }
        return store
    })[0]
}
