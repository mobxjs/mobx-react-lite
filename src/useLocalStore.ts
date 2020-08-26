import { observable } from "mobx"
import React from "react"

import { AnnotationsMap } from "mobx"

export function useLocalStore<TStore extends Record<string, any>>(
    initializer: () => TStore,
    annotations?: AnnotationsMap<TStore, never>
): TStore {
    return React.useState(() => observable(initializer(), annotations, { autoBind: true }))[0]
}
