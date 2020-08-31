import { observable, runInAction } from "mobx"
import React from "react"

import { isPlainObject } from "./utils"

export function useAsObservableSourceInternal<TSource>(
    current: TSource,
    usedByLocalStore: boolean
): TSource {
    const culprit = usedByLocalStore ? "useLocalStore" : "useAsObservableSource"
    if ("production" !== process.env.NODE_ENV && usedByLocalStore) {
        const [initialSource] = React.useState(current)
        if (
            (initialSource !== undefined && current === undefined) ||
            (initialSource === undefined && current !== undefined)
        ) {
            throw new Error(`make sure you never pass \`undefined\` to ${culprit}`)
        }
    }
    if (usedByLocalStore && current === undefined) {
        return undefined as any
    }
    if ("production" !== process.env.NODE_ENV && !isPlainObject(current)) {
        throw new Error(
            `${culprit} expects a plain object as ${usedByLocalStore ? "second" : "first"} argument`
        )
    }

    const [res] = React.useState(() => observable(current, {}, { deep: false }))
    if (
        "production" !== process.env.NODE_ENV &&
        Object.keys(res).length !== Object.keys(current).length
    ) {
        throw new Error(`the shape of objects passed to ${culprit} should be stable`)
    }
    runInAction(() => {
        Object.assign(res, current)
    })
    return res
}

export function useAsObservableSource<TSource>(current: TSource): TSource {
    return useAsObservableSourceInternal(current, false)
}
