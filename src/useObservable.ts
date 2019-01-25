import { observable } from "mobx"
import { useRef } from "react"

type SupportedValues = object | Map<any, any> | any[]

export function useObservable<T extends SupportedValues>(initialValue: T): T {
    const observableRef = useRef<T | null>(null)
    if (!observableRef.current) {
        observableRef.current = observable(initialValue)
    }

    return observableRef.current
}
