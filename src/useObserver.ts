import { Reaction } from "mobx"
import { useDebugValue, useRef } from "react"

import { printDebugValue } from "./printDebugValue"
import { isUsingStaticRendering } from "./staticRendering"
import { useForceUpdate, useUnmount } from "./utils"

export type ForceUpdateHook = () => () => void

export interface IUseObserverOptions {
    useForceUpdate?: ForceUpdateHook
}

const EMPTY_OBJECT = {}

export function useObserver<T>(
    fn: () => T,
    baseComponentName: string = "observed",
    options: IUseObserverOptions = EMPTY_OBJECT
): T {
    if (isUsingStaticRendering()) {
        return fn()
    }

    const wantedForceUpdateHook = options.useForceUpdate || useForceUpdate
    const forceUpdate = wantedForceUpdateHook()

    const reaction = useRef<Reaction | null>(null)
    if (!reaction.current) {
        reaction.current = new Reaction(`observer(${baseComponentName})`, () => {
            forceUpdate()
        })
    }

    const dispose = () => {
        if (reaction.current && !reaction.current.isDisposed) {
            reaction.current.dispose()
        }
    }

    useDebugValue(reaction, printDebugValue)

    useUnmount(() => {
        dispose()
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
        dispose()
        throw exception // re-throw any exceptions catched during rendering
    }
    return rendering
}
