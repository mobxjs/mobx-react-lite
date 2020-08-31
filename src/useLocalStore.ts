import { observable, runInAction, transaction } from "mobx"
import React from "react"

import { useAsObservableSourceInternal } from "./useAsObservableSource"
import { isPlainObject } from "./utils"

export function useLocalStore<TStore extends Record<string, any>>(initializer: () => TStore): TStore
export function useLocalStore<TStore extends Record<string, any>, TSource extends object>(
    initializer: (source: TSource) => TStore,
    current: TSource
): TStore
export function useLocalStore<TStore extends Record<string, any>, TSource extends object>(
    initializer: (source?: TSource) => TStore,
    current?: TSource
): TStore {
    const source = useAsObservableSourceInternal(current, true)

    return React.useState(() => {
        const local = observable(initializer(source))
        if (isPlainObject(local)) {
            runInAction(() => {
                Object.keys(local).forEach(key => {
                    const value = local[key]
                    if (typeof value === "function") {
                        // @ts-ignore No idea why ts2536 is popping out here
                        local[key] = wrapInTransaction(value, local)
                    }
                })
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
