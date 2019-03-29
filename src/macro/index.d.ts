// Provides typings for the macro version of useObserver

// a little duplication to avoid tsc building things outside this directory
type ForceUpdateHook = () => () => void
interface IUseObserverOptions {
    useForceUpdate?: ForceUpdateHook
}

// note: different signature than regular useObserver
export declare function useObserver<T>(
    baseComponentName?: string,
    options?: IUseObserverOptions
): void
