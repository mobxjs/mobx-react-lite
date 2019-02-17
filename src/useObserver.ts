import { Reaction, getDependencyTree, IDependencyTree } from "mobx"
import { useRef, useDebugValue } from "react"
import { isUsingStaticRendering } from "./staticRendering"
import { useForceUpdate, useUnmount } from "./utils"

export function useObserver<T>(fn: () => T, baseComponentName = "observed"): T {
    if (isUsingStaticRendering()) {
        return fn()
    }
    const forceUpdate = useForceUpdate()

    const reaction = useRef<Reaction | null>(null)
    if (!reaction.current) {
        reaction.current = new Reaction(`observer(${baseComponentName})`, () => {
            forceUpdate()
        })
    }

    useDebugValue(reaction, printDebugValue)

    useUnmount(() => {
        reaction.current!.dispose()
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

function printDebugValue(v: React.MutableRefObject<Reaction | null>) {
    if (!v.current) {
        return "<unknown>"
    }
    return getDependencyTree(v.current)
}
