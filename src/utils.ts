import { useCallback, useState } from "react"

export function useForceUpdate() {
    const [, setTick] = useState(0)

    const update = useCallback(() => {
        setTick(tick => tick + 1)
    }, [])

    return update
}

export function isPlainObject(value: any): boolean {
    if (!value || typeof value !== "object") {
        return false
    }
    const proto = Object.getPrototypeOf(value)
    return !proto || proto === Object.prototype
}
