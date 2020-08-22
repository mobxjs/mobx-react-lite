import { observable } from "mobx"
import React from "react"

import { useAsObservableSourceInternal } from "./useAsObservableSource"
import { AnnotationsMap } from "mobx/dist/internal"

export function useLocalStore<TStore extends Record<string, any>>(initializer: () => TStore): TStore
export function useLocalStore<TStore extends Record<string, any>, TSource extends object>(
    initializer: (source: TSource) => TStore,
    current?: TSource,
    annotations?: AnnotationsMap<TStore, never>
): TStore
export function useLocalStore<TStore extends Record<string, any>, TSource extends object>(
    initializer: (source?: TSource) => TStore,
    current?: TSource,
    annotations?: AnnotationsMap<TStore, never>
): TStore {
    const source = useAsObservableSourceInternal(current, true)

    return React.useState(() => {
        return observable(initializer(source), annotations, { autoBind: true })
    })[0]
}
