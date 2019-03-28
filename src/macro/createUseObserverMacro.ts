// @ts-ignore
import { createMacro } from "babel-plugin-macros"
import path from "path"

interface ICreateUseObserverMacroConfig {
    /**
     * provide an absolute path if this file is in your application, OR
     * provide a library import name.
     * this is transformed to:
     *   import { importSpecifier } from 'relative path to importSource, or as-is for library name';
     */
    importSource: string
    /**
     * provide the exported name from your importSource. i.e.: useMyObserverFunc
     * this is transformed to:
     *   import { importSpecifier } from 'relative path to importSource, or as-is for library name';
     */
    importSpecifier: string
}

/**
 *
 */

/**
 * Set up as follows:
 *
 * @example
 * ```javascript
 * // myapp/src/lib/customUseObserver.macro.js:
 *
 * const { createUseObserverMacro } = require("mobx-react-lite/macro/createUseObserverMacro")
 * const path = require("path")
 * module.exports = createUseObserverMacro({
 *     importSource: path.resolve(__dirname, "./customUseObserver"),
 *     importSpecifier: "useCustomObserver"
 * })
 * ```
 *
 * @example
 * ```typescript
 * // myapp/src/lib/customUseObserver.ts:
 *
 * import { useComputed, useObserver, useObservable } from "mobx-react-lite"
 *
 * const HOOKS = {
 *     useComputed,
 *     useObservable,
 *     observerHooks: {
 *         useComputed,
 *         useObservable
 *     }
 * }
 *
 * export type UseCustomObserverHooks = typeof HOOKS
 *
 * export function useCustomObserver<T>(
 *     func: (hooks: UseCustomObserverHooks) => T,
 *     baseComponentName?: string
 * ): T {
 *     return useObserver(() => func(HOOKS), baseComponentName)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // myapp/src/lib/customUseObserver.ts.d:
 *
 * import { useComputed, useObservable } from "mobx-react-lite"
 * declare module "useCustomObserver.macro"
 *
 * interface UseCustomObserverHooks {
 *     useComputed: typeof useComputed
 *     useObservable: typeof useObservable
 *     observerHooks: UseCustomObserverHooks
 * }
 *
 * export declare function useObserver<T>(baseComponentName?: string): UseCustomObserverHooks
 * ```
 *
 * @example
 * ```typescript
 * //Then, to use it in your app:
 *
 * import { useObserver } from "../path/to/useCustomObserver.macro"
 *
 * export const MyComponent = props => {
 *     const { useObservable, useComputed } = useObserver()
 *     const foo = useObservable({ foo: 1 })
 *     const bar = useComputed(() => foo.foo + 1)
 *     return <div>...</div>
 * }
 * ```
 */
export function createUseObserverMacro(config: ICreateUseObserverMacroConfig) {
    return createMacro(function useObserverMacro({
        references,
        state: {
            file: {
                opts: { filename }
            }
        },
        babel: { types: t }
    }: any) {
        // transform the importSource to a relative path if its not a library
        let { importSource } = config
        if (path.isAbsolute(importSource)) {
            importSource = `./${path.relative(path.dirname(filename), importSource)}`
        }

        const { useObserver = [] } = references

        useObserver.forEach((referencePath: any) => {
            // program is the top scope of the file
            const program = referencePath.scope.getProgramParent().path
            const line = referencePath.getStatementParent()
            // lineVars is the `{a, b}` in: const {a, b} = useObserver();
            const lineVars = line.node.declarations ? line.node.declarations[0].id : null
            // get all lines in the scope that follow.  these get moved automatically
            const linesAfter = line.container.splice(
                line.key + 1,
                line.container.length - line.key - 1
            )

            // return a new function taking lineVars as args, containing linesAfter.
            // the name `useObserverRenderHook` is not important.
            line.insertAfter(
                t.returnStatement(
                    t.callExpression(t.identifier(config.importSpecifier), [
                        t.functionExpression(
                            t.identifier("useObserverRenderHook"),
                            lineVars ? [lineVars] : [],
                            t.blockStatement(linesAfter),
                            false,
                            false
                        )
                    ])
                )
            )
            // remove the original line
            line.remove()

            // check to see if we've already added the real import line to this file
            const foundImport =
                program.get("body").filter((x: any) => {
                    if (t.isImportDeclaration(x) && x.node.source.value === importSource) {
                        return !!x.node.specifiers.filter(
                            (s: any) => s.local.name === config.importSpecifier
                        )
                    }
                    return false
                }).length > 0

            // if not, add it, i.e.:
            // import { importSpecifier } from importSource
            if (!foundImport) {
                program.unshiftContainer(
                    "body",
                    t.importDeclaration(
                        [
                            t.importSpecifier(
                                t.identifier(config.importSpecifier),
                                t.identifier(config.importSpecifier)
                            )
                        ],
                        t.stringLiteral(importSource)
                    )
                )
            }
        })
    })
}
