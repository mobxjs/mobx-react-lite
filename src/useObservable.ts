import { observable } from "mobx"
import { useRef } from "react"

type SupportedValues = object | Map<unknown, unknown> | Array<unknown>

export function useObservable<T extends SupportedValues>(initialValue: T): T {
    return useRef(observable(initialValue)).current
}
