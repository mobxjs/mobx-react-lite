import { observable } from "mobx"
import { useRef } from "react"

type SupportedValues = object | Map<any, any> | any[]

let warned = false

export function useObservable<T extends SupportedValues>(initialValue: T): T {
    if (process.env.NODE_ENV !== "production" && !warned) {
        warned = true
        // tslint:disable-next-line: no-console
        console.warn(
            "[mobx-react-lite] useObservable has been deprecated. Use useLocalStore instead"
        )
    }

    const observableRef = useRef<T | null>(null)
    if (!observableRef.current) {
        observableRef.current = observable(initialValue)
    }

    return observableRef.current
}
