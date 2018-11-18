import { Reaction } from "mobx"
import { forwardRef, memo, useCallback, useRef, useState } from "react"
import { useUnmount } from "./utils"

let isUsingStaticRendering = false

export function useStaticRendering(enable: boolean) {
    isUsingStaticRendering = enable
}

export interface IObserverOptions {
    readonly forwardRef?: boolean
}

export function observer<P extends object, TRef = {}>(
    baseComponent: React.RefForwardingComponent<TRef, P>,
    options: IObserverOptions & { forwardRef: true }
): React.MemoExoticComponent<
    React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<TRef>>
>
export function observer<P extends object>(
    baseComponent: React.FunctionComponent<P>,
    options?: IObserverOptions
): React.NamedExoticComponent<P>

// n.b. base case is not used for actual typings or exported in the typing files
export function observer<P extends object, TRef = {}>(
    baseComponent: React.RefForwardingComponent<TRef, P>,
    options?: IObserverOptions
) {
    // The working of observer is explaind step by step in this talk: https://www.youtube.com/watch?v=cPF4iBedoF0&feature=youtu.be&t=1307
    if (isUsingStaticRendering) {
        return baseComponent
    }

    const realOptions = {
        forwardRef: false,
        ...options
    }

    const baseComponentName = baseComponent.displayName || baseComponent.name

    const wrappedComponent = (props: P, ref: React.Ref<TRef>) => {
        const observerReaction = useObserverReaction(baseComponentName)

        // render the original component, but have the
        // reaction track the observables, so that rendering
        // can be invalidated (see above) once a dependency changes
        let rendering!: ReturnType<typeof baseComponent>
        observerReaction.track(() => {
            rendering = baseComponent(props, ref)
        })
        return rendering
    }

    // memo; we are not intested in deep updates
    // in props; we assume that if deep objects are changed,
    // this is in observables, which would have been tracked anyway
    let memoComponent
    if (realOptions.forwardRef) {
        // we have to use forwardRef here because:
        // 1. it cannot go before memo, only after it
        // 2. forwardRef converts the function into an actual component, so we can't let the baseComponent do it
        //    since it wouldn't be a callable function anymore
        memoComponent = memo(forwardRef(wrappedComponent))
    } else {
        memoComponent = memo(wrappedComponent)
    }

    memoComponent.displayName = baseComponentName
    return memoComponent
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

    const reaction = useRef(
        new Reaction(`observer(${baseComponentName})`, () => {
            forceUpdate()
        })
    )

    useUnmount(() => {
        reaction.current.dispose()
    })

    return reaction.current
}
