import { IReactionDisposer } from "mobx"

import { useDisposable } from "./useDisposable"

/**
 * Adds an observable effect (reaction, autorun, or anything else that returns a disposer) that will be registered upon component creation and disposed upon unmounting.
 * Returns the generated disposer for early disposal.
 *
 * @deprecated Renamed to useDisposable for a more universal use
 * @export
 * @template D
 * @param {() => D} disposerGenerator A function that returns the disposer of the wanted effect.
 * @param {ReadonlyArray<any>} [inputs=[]] If you want the effect to be automatically re-created when some variable(s) are changed then pass them in this array.
 * @returns {D}
 */
export function useObservableEffect<D extends IReactionDisposer>(
    disposerGenerator: () => D,
    inputs: ReadonlyArray<any> = []
): D {
    return useDisposable(disposerGenerator, inputs)
}
