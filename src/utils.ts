import { useEffect } from "react"

export function useUnmount(fn: () => void, inputs: ReadonlyArray<any> = []) {
    useEffect(() => fn, inputs)
}
