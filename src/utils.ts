import { useCallback, useEffect, useState } from "react"

const EMPTY_ARRAY: any[] = []

export function useUnmount(fn: () => void) {
    useEffect(() => fn, EMPTY_ARRAY)
}

export function useForceUpdate() {
    const [, setTick] = useState(null)

    const update = useCallback(() => {
        setTick(null)
    }, [])

    return update
}
