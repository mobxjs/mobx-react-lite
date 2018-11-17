import { Reaction } from "mobx"
import * as React from "react"
import { FunctionComponent, memo, useCallback, useRef, useState } from "react"
import { useUnmount } from "./utils"

let isUsingStaticRendering = false

export function useStaticRendering(enable: boolean) {
    isUsingStaticRendering = enable
}

export function observer<P>(baseComponent: FunctionComponent<P>): FunctionComponent<P> {
    // The working of observer is explaind step by step in this talk: https://www.youtube.com/watch?v=cPF4iBedoF0&feature=youtu.be&t=1307
    if (isUsingStaticRendering) {
        return baseComponent
    }

    const baseComponentName = baseComponent.displayName || baseComponent.name

    // memo; we are not intested in deep updates
    // in props; we assume that if deep objects are changed,
    // this is in observables, which would have been tracked anyway
    const memoComponent = memo((props: P) => {
        const observerReaction = useObserverReaction(baseComponentName)

        // render the original component, but have the
        // reaction track the observables, so that rendering
        // can be invalidated (see above) once a dependency changes
        let rendering!: React.ReactElement<any> | null
        observerReaction.track(() => {
            rendering = baseComponent(props)
        })
        return rendering
    })
    memoComponent.displayName = baseComponentName
    return memoComponent as any
}

function useForceUpdate() {
    const [tick, setTick] = useState(1)

    const update = useCallback(() => {
        setTick(tick + 1)
    }, [])

    return update
}

function useObserverReaction(baseComponentName: string) {
    // forceUpdate 2.0
    const forceUpdate = useForceUpdate()

    const lastReaction = useRef<Reaction | undefined>(undefined)
    useUnmount(() => {
        if (lastReaction.current) {
            lastReaction.current.dispose()
            lastReaction.current = undefined
        }
    })

    // we create a reaction per render to make sure we only re-render when observed values change OUTSIDE the render phase
    if (lastReaction.current) {
        lastReaction.current.dispose()
        lastReaction.current = undefined
    }

    lastReaction.current = new Reaction(`observer(${baseComponentName})`, forceUpdate)

    return lastReaction.current
}
