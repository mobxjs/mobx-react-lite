import { useCallback, useEffect, useState } from "react"

const EMPTY_ARRAY: any[] = []

export function useUnmount(fn: () => void) {
    useEffect(() => fn, EMPTY_ARRAY)
}

let skippingForceUpdate = 0

export function useForceUpdate() {
    const [, setTick] = useState(0)

    const update = useCallback(() => {
        if (!skippingForceUpdate) {
            setTick(tick => tick + 1)
        }
    }, [])

    return update
}

export function useSkipForceUpdate<T>(fn: () => T): T {
    skippingForceUpdate++
    try {
        return fn()
    } finally {
        skippingForceUpdate--
    }
}
