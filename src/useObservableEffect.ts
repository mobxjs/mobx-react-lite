import { IReactionDisposer } from "mobx"
import { useEffect, useMemo, useRef } from "react"

/**
 * Adds an observable effect (reaction, autorun, or anything else that returns a disposer) that will be registered upon component creation and disposed upon unmounting.
 * Returns the generated disposer for early disposal.
 *
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
    const disposerRef = useRef<D | undefined>(undefined)

    useMemo(() => {
        disposerRef.current = disposerGenerator()
    }, inputs)

    useEffect(() => {
        return () => {
            if (disposerRef.current) {
                disposerRef.current()
            }
        }
    }, inputs)

    return disposerRef.current!
}
