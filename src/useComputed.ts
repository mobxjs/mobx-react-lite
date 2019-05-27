import * as mobx from "mobx"
import { useMemo } from "react"

let warned = false

export function useComputed<T>(func: () => T, inputs: ReadonlyArray<any> = []): T {
    if (process.env.NODE_ENV !== "production" && !warned) {
        warned = true
        // tslint:disable-next-line: no-console
        console.warn(
            "[mobx-react-lite] useComputed has been deprecated. Use useLocalStore instead."
        )
    }
    const computed = useMemo(() => mobx.computed(func), inputs)
    return computed.get()
}
