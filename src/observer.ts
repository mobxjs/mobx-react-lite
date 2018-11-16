import { Reaction } from "mobx"
import { FunctionComponent, memo, useEffect, useMemo, useState } from "react"

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

    const memoComponent = memo(props => {
        // forceUpdate 2.0
        const forceUpdate = useForceUpdate()

        // create a Reaction once, and memoize it
        const reaction = useMemo(
            () =>
                // If the Reaction detects a change in dependency,
                // force a new render
                new Reaction(
                    `observer(${baseComponentName})`,
                    forceUpdate
                ),
            []
        )

        // clean up the reaction if this component is unMount
        useUnmount(() => reaction.dispose())

        // render the original component, but have the
        // reaction track the observables, so that rendering
        // can be invalidated (see above) once a dependency changes
        let rendering
        reaction.track(() => {
            rendering = baseComponent(props as P)
        })
        return rendering
    })
    memoComponent.displayName = baseComponentName
    return memoComponent
}

function useForceUpdate() {
    const [tick, setTick] = useState(1)
    return () => {
        setTick(tick + 1)
    }
}

function useUnmount(fn) {
    useEffect(() => fn, [])
}
