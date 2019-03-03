import { observable } from "mobx"
import { useRef } from "react"

type SupportedValues = object | Map<any, any> | any[]

// The two overloads below seems strange. But if I combine them to `initialValue: (() => T) | T)`,
// typescript would infer a wrong return type. tslint tells me to combine them, so just ignore tslint.
export function useObservable<T extends SupportedValues>(initialValue: () => T): T
// tslint:disable-next-line
export function useObservable<T extends SupportedValues>(initialValue: T): T
export function useObservable<T extends SupportedValues>(initialValue: (() => T) | T): T {
    const observableRef = useRef<T | null>(null)
    if (!observableRef.current) {
        if (typeof initialValue === "function") {
            initialValue = (initialValue as () => T)()
        }
        observableRef.current = observable(initialValue)
    }

    return observableRef.current
}
