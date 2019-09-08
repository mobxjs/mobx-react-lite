import React from "react"

const EMPTY_ARRAY: any[] = []

export function useUnmount(fn: () => void) {
    React.useEffect(() => fn, EMPTY_ARRAY)
}

export function useForceUpdate() {
    const [, setTick] = React.useState(0)

    const update = React.useCallback(() => {
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
