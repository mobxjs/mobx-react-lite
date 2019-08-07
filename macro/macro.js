import { createMacro, MacroError } from "babel-plugin-macros"
import { addNamed } from "@babel/helper-module-imports"
import * as t from "@babel/types"

export default createMacro(mobxReactLiteMacro)

function mobxReactLiteMacro({ references, state, babel }) {
    addImportDeclarations(references, state)

    Object.keys(references).forEach(referenceName => {
        references[referenceName].forEach(path => {
            if (referenceName === "observer") {
                const componentName = getComponentName(path)
                transformToNamedFunction(path, componentName)
            }
        })
    })
}

function addImportDeclarations(references, state) {
    const program = state.file.path
    Object.keys(references).forEach(referenceName => {
        const moduleImport = addNamed(program, referenceName, "mobx-react-lite", {
            nameHint: referenceName
        })
        references[referenceName].forEach(path => (path.node.name = moduleImport.name))
    })
}

function throwError(path, message) {
    throw new MacroError(
        `\n[mobx-react-lite/macro]: ${message}\n  at:\n` + path.parentPath.parentPath.getSource()
    ) + `\n\nExample of correct usage: const MyComponent = observer(() => { return <div/> })\n`
}

function getComponentName(path) {
    const parentContainer = path.parentPath.container
    if (!t.isVariableDeclarator(parentContainer) || !parentContainer.id.name) {
        throwError(
            path,
            "Can't determine component name! Observer macro has to be used in a variable assignment"
        )
    }
    return parentContainer.id.name
}

function transformToNamedFunction(path, componentName) {
    if (!path.container.arguments || !path.container.arguments.length) {
        throwError(path, "Observer macro has no arguments")
    }
    const innerFunction = path.container.arguments[0]
    if (!t.isFunctionExpression(innerFunction) && !t.isArrowFunctionExpression(innerFunction)) {
        throwError(path, "First argument of observer macro has to be a function")
    }
    innerFunction.type = "FunctionExpression"
    innerFunction.id = t.identifier(componentName)
}
