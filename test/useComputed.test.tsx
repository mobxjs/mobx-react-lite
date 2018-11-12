import { observable } from 'mobx'
import * as React from 'react'
import { cleanup, render } from 'react-testing-library'

import { observer, useComputed } from '../src'

afterEach(cleanup)

describe("is used to rerender based on a computed value change", () => {
    it("keeps track of observable values", () => {
        const TestComponent = observer((props: any) => {
            const value = useComputed(() => props.store.x + 5 * props.store.y)
            return <div>{value}</div>
        })
        const store = observable({ x: 5, y: 1 })
        const { container } = render(<TestComponent store={store} />)
        const div = container.querySelector("div")!
        expect(div.textContent).toBe("10")
        store.y = 2
        expect(div.textContent).toBe("15")
        store.x = 10
        expect(div.textContent).toBe("20")
    })

    it("allows non-observables to be used if specified as inputs", () => {
        const TestComponent = observer((props: any) => {
            const value = useComputed(() => props.store.x + 5 * props.y, [props.y])
            return <div>{value}</div>
        })
        const store = observable({ x: 5 })
        const { container, rerender } = render(<TestComponent store={store} y={1} />)
        const div = container.querySelector("div")!
        expect(div.textContent).toBe("10")
        rerender(<TestComponent store={store} y={2} />)
        expect(div.textContent).toBe("15")
        store.x = 10
        expect(div.textContent).toBe("20")
    })
})
