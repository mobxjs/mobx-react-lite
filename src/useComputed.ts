import * as mobx from "mobx"
import { IComputedValueOptions } from "mobx"
import { useMemo } from "react"

export function useComputed<T>(
    func: () => T,
    inputs: ReadonlyArray<any> = [],
    options?: IComputedValueOptions<T>
): T {
    const computed = useMemo(() => mobx.computed(func, options), inputs)
    return computed.get()
}
