import * as mobx from "mobx"
import { useMemo } from "react"

export function useComputed<T>(initialValue: () => T, inputs: ReadonlyArray<unknown> = []): T {
    const computed = useMemo(() => mobx.computed(initialValue), inputs)
    return computed.get()
}
