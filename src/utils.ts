import { useLayoutEffect } from "react"

const EMPTY_ARRAY: any[] = []

export function useUnmount(fn: () => void) {
    useLayoutEffect(() => fn, EMPTY_ARRAY)
}
