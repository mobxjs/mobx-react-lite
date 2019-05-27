import { observable, transaction } from "mobx"
import React from "react"

import { useAsObservableSourceInternal } from "./useAsObservableSource"
import { isPlainObject } from "./utils"

export function useLocalStore<TStore extends Record<string, any>, TSource extends object = any>(
    initializer: (source: TSource) => TStore,
    current?: TSource
): TStore {
    const source = useAsObservableSourceInternal<TSource | undefined>(current, true)

    return React.useState(() => {
        const local = observable(initializer(source as TSource))
        if (isPlainObject(local)) {
            Object.keys(local).forEach(key => {
                const value = local[key]
                if (typeof value === "function") {
                    local[key] = wrapInTransaction(value, local)
                }
            })
        }
        return local
    })[0]
}

// tslint:disable-next-line: ban-types
function wrapInTransaction(fn: Function, context: object) {
    return (...args: unknown[]) => {
        return transaction(() => fn.apply(context, args))
    }
}
