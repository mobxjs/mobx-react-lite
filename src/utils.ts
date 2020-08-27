import { useCallback, useState, useMemo } from "react"

const EMPTY_ARRAY: any[] = []

export function useForceUpdate() {
    const [, setTick] = useState(0)

    const update = useCallback(() => {
        setTick(tick => tick + 1)
    }, EMPTY_ARRAY)

    return update
}

const deprecatedMessages: string[] = []

export function useDeprecated(msg: string) {
    if ("production" !== process.env.NODE_ENV) {
        useMemo(() => {
            if (!deprecatedMessages.includes(msg)) {
                deprecatedMessages.push(msg)
                console.warn(msg)
            }
        }, [])
    }
}
