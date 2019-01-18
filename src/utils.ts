import { useEffect } from "react"

const EMPTY_ARRAY: any[] = []

export function useUnmount(fn: () => void) {
    useEffect(() => fn, EMPTY_ARRAY)
}
