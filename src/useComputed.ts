import { computed } from "mobx"
import { useEffect, useState } from "react"

export function useComputed<T>(initialValue: () => T): T {
    const value = computed(initialValue)
    const [state, setState] = useState(value.get())
    useEffect(() => {
        return value.observe(change => {
            setState(change.newValue)
        })
    }, [])
    return state
}
