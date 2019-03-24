import { Reaction } from "mobx"
import { useDebugValue, useRef } from "react"
import { printDebugValue } from "./printDebugValue"
import { isUsingStaticRendering } from "./staticRendering"
import { useForceUpdate, useUnmount } from "./utils"

export type ForceUpdateHook = () => () => void

export function useObserver<T>(
    fn: () => T,
    baseComponentName?: string,
    customForceUpdateHook?: ForceUpdateHook
): T {
    if (isUsingStaticRendering()) {
        return fn()
    }

    const forceUpdate = customForceUpdateHook ? customForceUpdateHook() : useForceUpdate()

    const reaction = useRef<Reaction | null>(null)
    if (!reaction.current) {
        reaction.current = new Reaction(`observer(${baseComponentName || "observed"})`, () => {
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
    let exception
    reaction.current.track(() => {
        try {
            rendering = fn()
        } catch (e) {
            exception = e
        }
    })
    if (exception) {
        reaction.current.dispose()
        throw exception // re-throw any exceptions catched during rendering
    }
    return rendering
}
