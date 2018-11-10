import { observable } from "mobx"
import { useState } from "react"

export function useObservable(initialValue) {
    if (typeof initialValue === "function") {
        return useState(() => observable(initialValue()))[0]
    }
    return useState(observable(initialValue))[0]
}
