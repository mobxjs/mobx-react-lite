/**
 * Turns a React component or stateless render function into a reactive component.
 */
import * as React from "react"

export type IReactComponent<P = any> =
    | React.StatelessComponent<P>
    | React.ComponentClass<P>
    | React.ClassicComponentClass<P>

/**
 * Observer
 */

// Deprecated: observer with with stores (as decorator)
export function observer(stores: string[]): <T extends IReactComponent>(clazz: T) => void
// Deprecated: observer with with stores
export function observer<T extends IReactComponent>(stores: string[], clazz: T): T
export function observer<T extends IReactComponent>(target: T): T

/**
 * Inject
 */
export type IValueMap = { [key: string]: any }
export type IStoresToProps<
    S extends IValueMap = {},
    P extends IValueMap = {},
    I extends IValueMap = {},
    C extends IValueMap = {}
> = (stores: S, nextProps: P, context: C) => I

export type IWrappedComponent<P> = {
    wrappedComponent: IReactComponent<P>
    wrappedInstance: React.ReactInstance | undefined
}

/**
 * disposeOnUnmount
 */
type Disposer = () => void
export function disposeOnUnmount(target: React.Component<any, any>, propertyKey: string): void
export function disposeOnUnmount<TF extends Disposer | Disposer[]>(
    target: React.Component<any, any>,
    fn: TF
): TF

/**
 * Utilities
 */
export function onError(cb: (error: Error) => void): () => void

export class Observer extends React.Component<
    {
        children?: () => React.ReactNode
        render?: () => React.ReactNode
    },
    {}
> {}

/**
 * Hooks
 */
export function useObservable<T>(initialValue: T | (() => T)): T

export function useStaticRendering(value: boolean): void

/**
 * Enable dev tool support, makes sure that renderReport emits events.
 */
export function trackComponents(): void

export const renderReporter: RenderReporter

export interface RenderReporter {
    on(handler: (data: IRenderEvent) => void): void
}

export interface IRenderEvent {
    event: "render" | "destroy"
    renderTime?: number
    totalTime?: number
    component: React.ReactElement<any> // Component instance
    node: any // DOMNode
}

/**
 * WeakMap DOMNode -> Component instance
 * @deprecated
 */
export const componentByNodeRegistery: any
/**
 * WeakMap DOMNode -> Component instance
 */
export const componentByNodeRegistry: any

/**
 * @deprecated, use PropTypes instead
 */
export const propTypes: {
    observableArray: React.Requireable<any>
    observableArrayOf: (type: React.Validator<any>) => React.Requireable<any>
    observableMap: React.Requireable<any>
    observableObject: React.Requireable<any>
    arrayOrObservableArray: React.Requireable<any>
    arrayOrObservableArrayOf: (type: React.Validator<any>) => React.Requireable<any>
    objectOrObservableObject: React.Requireable<any>
}

export const PropTypes: {
    observableArray: React.Requireable<any>
    observableArrayOf: (type: React.Validator<any>) => React.Requireable<any>
    observableMap: React.Requireable<any>
    observableObject: React.Requireable<any>
    arrayOrObservableArray: React.Requireable<any>
    arrayOrObservableArrayOf: (type: React.Validator<any>) => React.Requireable<any>
    objectOrObservableObject: React.Requireable<any>
}
