import { observable } from "mobx"
import { useState } from "react"

import { isPlainObject } from "./utils"

export function useAsObservableSource<T>(current: T): T {
    if (!isPlainObject(current)) {
        throw new Error("useAsObservableSource expects an object as first argument")
    }

    const res = useState(() => observable(current, {}, { deep: false }))[0]
    if (Object.keys(res).length !== Object.keys(current).length) {
        throw new Error("the shape of objects passed to useAsObservableSource should be stable")
    }
    Object.assign(res, current)
    return res
}
