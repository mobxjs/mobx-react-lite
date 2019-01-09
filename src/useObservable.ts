import { observable } from "mobx"
import { useRef } from "react"

type SupportedValues = object | Map<any, any> | any[]

export function useObservable<T extends SupportedValues>(initialValue: T): T {
    const ref = useRef(null as any)
    if (!ref.current) {
        let observableObject = {}
        if (typeof initialValue === "function") {
            observableObject = observable(initialValue.call(null))
        } else {
            observableObject = observable(initialValue)
        }
        ref.current = observable(observableObject)
    }
    return ref.current
}
