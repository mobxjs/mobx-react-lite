import { Reaction } from "mobx"
import { useDebugValue, useEffect, useRef } from "react"
import { printDebugValue } from "./printDebugValue"
import { isUsingStaticRendering } from "./staticRendering"
import { useForceUpdate } from "./utils"

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
    const committed = useRef(false)

    if (!reaction.current) {
        // First render for this component. Not yet committed.
        reaction.current = new Reaction(`observer(${baseComponentName})`, () => {
            // Observable has changed. Only force an update if we've definitely
            // been committed.
            if (committed.current) {
                forceUpdate()
            }
        })
    }

    useDebugValue(reaction, printDebugValue)

    useEffect(() => {
        committed.current = true
        return () => reaction.current!.dispose()
    }, [])

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
