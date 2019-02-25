import { forwardRef, memo } from "react"
import { isUsingStaticRendering } from "./staticRendering"
import { useObserver } from "./useObserver"
import hoistStatics from "hoist-non-react-statics"

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
    if (isUsingStaticRendering()) {
        return baseComponent
    }

    const realOptions = {
        forwardRef: false,
        ...options
    }

    const baseComponentName = baseComponent.displayName || baseComponent.name

    const wrappedComponent = (props: P, ref: React.Ref<TRef>) => {
        return useObserver(() => baseComponent(props, ref), baseComponentName)
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

    copyStaticProperties(baseComponent as any, memoComponent as any)
    memoComponent.displayName = baseComponentName

    return memoComponent
}

function copyStaticProperties(base: React.FunctionComponent, target: React.FunctionComponent) {
    hoistStatics(target, base) // See #32
    // propTypes and defaultProps need to be hoisted as well since we wrap and invoke the component as function, not as type
    if (base.propTypes) {
        target.propTypes = base.propTypes
    }
    if (base.defaultProps) {
        target.defaultProps = base.defaultProps
    }
}
