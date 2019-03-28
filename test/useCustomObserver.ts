import { useComputed, useObservable, useObserver } from "../src"

const HOOKS = {
    useComputed,
    useObservable,
    observerHooks: {
        useComputed,
        useObservable
    }
}

export type UseCustomObserverHooks = typeof HOOKS

export function useCustomObserver<T>(
    func: (hooks: UseCustomObserverHooks) => T,
    baseComponentName?: string
): T {
    return useObserver(() => func(HOOKS), baseComponentName)
}
