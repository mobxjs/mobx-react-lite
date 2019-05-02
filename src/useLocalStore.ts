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

export function useLocalStore<T>(initializer: (props?: any) => T, current?: any): T {
    const local = useState(() => {
        let props
        if (isPlainObject(current)) {
            props = observable(current, {}, { deep: false })
        }
        const store: any = observable(initializer(props))
        if (isPlainObject(store)) {
            Object.keys(store).forEach(key => {
                const value = store[key]
                if (typeof value === "function") {
                    store[key] = wrapInTransaction(value.bind(store))
                }
            })
        }
        return { store, props }
    })[0]

    if (isPlainObject(current)) {
        if (
            process.env.NODE_ENV !== "production" &&
            Object.keys(local.props).length !== Object.keys(current).length
        ) {
            throw new Error("the shape of props passed to useLocalStore should be stable")
        }
        Object.assign(local.props, current)
    } else if (process.env.NODE_ENV !== "production" && typeof current !== "undefined") {
        throw new Error("useLocalStore expects an object as second argument")
    }

    return local.store
}
