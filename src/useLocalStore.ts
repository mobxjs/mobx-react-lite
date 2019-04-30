import { observable, transaction } from "mobx"
import { useMemo } from "react"
import { isPlainObject } from "./utils"

// tslint:disable-next-line: ban-types
function wrapInTransaction(fn: Function) {
    // tslint:disable-next-line: only-arrow-functions
    return function() {
        const args = arguments
        return transaction(() => fn.apply(null, args))
    }
}

export function useLocalStore<T>(initializer: (props?: any) => T, props?: any): T {
    const res = useMemo(() => (props ? observable(props, {}, { deep: false }) : {}), [])

    if (typeof props !== "undefined") {
        if (process.env.NODE_ENV !== "production" && !isPlainObject(props)) {
            throw new Error("useLocalStore expects an object as second argument")
        }

        if (
            process.env.NODE_ENV !== "production" &&
            Object.keys(res).length !== Object.keys(props).length
        ) {
            throw new Error("the shape of props passed to useLocalStore should be stable")
        }

        Object.assign(res, props)
    }

    return useMemo(() => {
        const store: any = observable(initializer(res))
        if (isPlainObject(store)) {
            Object.keys(store).forEach(key => {
                const value = store[key]
                if (typeof value === "function") {
                    store[key] = wrapInTransaction(value.bind(store))
                }
            })
        }
        return store
    }, [])
}
