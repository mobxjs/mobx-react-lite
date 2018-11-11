import { observable } from "mobx"
import { useRef } from "react"

export function useObservable<T extends object>(initialValue: T): T {
    return useRef(observable(initialValue)).current
}
