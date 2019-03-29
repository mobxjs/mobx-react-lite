// @ts-ignore
import { createMacro } from "babel-plugin-macros"
import path from "path"

interface ICreateUseObserverConfig {
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

export function createUseObserver(config: ICreateUseObserverConfig) {
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
            const lineArgs = referencePath.container.arguments
            // get all lines in the scope that follow.  these get moved automatically
            const linesAfter = line.container.splice(
                line.key + 1,
                line.container.length - line.key - 1
            )

            // return a new function containing linesAfter.
            // the name `useObserverRenderHook` is not important.
            line.insertAfter(
                t.returnStatement(
                    t.callExpression(t.identifier(config.importSpecifier), [
                        t.functionExpression(
                            t.identifier("useObserverRenderHook"),
                            [],
                            t.blockStatement(linesAfter),
                            false,
                            false
                        ),
                        ...lineArgs
                    ])
                )
            )
            // remove the original line
            line.remove()

            // check to see if we've already added the real import line to this file
            const foundImport =
                program.get("body").filter((x: any) => {
                    if (t.isImportDeclaration(x) && x.node.source.value === importSource) {
                        return (
                            x.node.specifiers.filter(
                                (s: any) => s.local.name === config.importSpecifier
                            ).length > 0
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
