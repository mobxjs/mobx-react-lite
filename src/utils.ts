import { useCallback, useEffect, useState } from "react"

const EMPTY_ARRAY: any[] = []

export function useUnmount(fn: () => void) {
    useEffect(() => fn, EMPTY_ARRAY)
}

export function useForceUpdate() {
    const [, setTick] = useState(0)

    const update = useCallback(() => {
        setTick(tick => tick + 1)
    }, [])

    return update
}

export function isPlainObject(value: any): value is object {
    if (!value || typeof value !== "object") {
        return false
    }
    const proto = Object.getPrototypeOf(value)
    return !proto || proto === Object.prototype
}

export function getSymbol(name: string): symbol | string {
    if (typeof Symbol === "function") {
        return Symbol.for(name)
    }
    return `__$mobx-react ${name}__`
}

declare const window: any
declare const self: any

const mockGlobal = {}

export function getGlobal() {
    if (typeof window !== "undefined") {
        return window
    }
    if (typeof global !== "undefined") {
        return global
    }
    if (typeof self !== "undefined") {
        return self
    }
    return mockGlobal
}
