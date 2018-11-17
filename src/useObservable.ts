import { observable } from "mobx"
import { useRef } from "react"

type SupportedValues = object | Map<any, any> | any[]

export function useObservable<T extends SupportedValues>(initialValue: T): T {
    return useRef(observable(initialValue)).current
}
