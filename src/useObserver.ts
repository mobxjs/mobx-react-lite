import { Reaction } from "mobx"
import { useCallback, useRef, useState } from "react"
import { isUsingStaticRendering } from "./staticRendering"
import { useUnmount } from "./utils"

function useForceUpdate() {
    const [tick, setTick] = useState(1)

    const update = useCallback(() => {
        setTick(tick + 1)
    }, [])

    return update
}

export function useObserver<T>(fn: () => T, baseComponentName = "anonymous"): T {
    if (isUsingStaticRendering()) {
        return fn()
    }

    // forceUpdate 2.0
    const forceUpdate = useForceUpdate()

    const reaction = useRef(
        new Reaction(`observer(${baseComponentName})`, () => {
            forceUpdate()
        })
    )

    useUnmount(() => {
        reaction.current.dispose()
    })

    // render the original component, but have the
    // reaction track the observables, so that rendering
    // can be invalidated (see above) once a dependency changes
    let rendering!: T
    reaction.current.track(() => {
        rendering = fn()
    })
    return rendering
}
