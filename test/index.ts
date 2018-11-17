import { configure } from "enzyme"
import Adapter from "enzyme-adapter-react-16"
import * as React from "react"
import * as ReactDOM from "react-dom"

configure({ adapter: new Adapter() })

export function createTestRoot() {
    if (!window.document.body) {
        window.document.body = document.createElement("body")
    }
    const testRoot = document.createElement("div")
    document.body.appendChild(testRoot)
    return testRoot
}

export function sleepHelper(time: number) {
    return new Promise(resolve => {
        setTimeout(resolve, time)
    })
}

export function asyncReactDOMRender(Component: React.ReactElement<any>, root: Element) {
    return new Promise(resolve => {
        ReactDOM.render(Component, root, resolve)
    })
}

export function withConsole(fn: () => void) {
    const { warn, error, info } = global.console
    const warnings: any[] = []
    const errors: any[] = []
    const infos: any[] = []
    try {
        Object.assign(global.console, {
            warn() {
                warnings.push([...arguments])
            },
            error() {
                errors.push([...arguments])
            },
            info() {
                infos.push([...arguments])
            }
        })
        fn()
        return {
            warnings,
            errors,
            infos
        }
    } finally {
        Object.assign(global.console, { warn, error, info })
    }
}

export async function withAsyncConsole(fn: () => void) {
    const { warn, error, info } = global.console
    const warnings: any[] = []
    const errors: any[] = []
    const infos: any[] = []
    try {
        Object.assign(global.console, {
            warn() {
                warnings.push([...arguments])
            },
            error() {
                errors.push([...arguments])
            },
            info() {
                infos.push([...arguments])
            }
        })
        await fn()
        return {
            warnings,
            errors,
            infos
        }
    } finally {
        Object.assign(global.console, { warn, error, info })
    }
}
