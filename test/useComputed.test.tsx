import { observable } from 'mobx'
import * as React from 'react'
import { cleanup, render } from 'react-testing-library'

import { observer, useComputed } from '../src'

afterEach(cleanup)

xdescribe("is used to rerender based on a computed value change", () => {
    it("does not work :(", () => {
        const TestComponent = observer((props: any) => {
            const value = useComputed(() => props.store.x + 5 * props.store.y)
            return <div>{value}</div>
        })
        const store = observable({ x: 5, y: 1 })
        const { container } = render(<TestComponent store={store} />)
        const div = container.querySelector("div")!
        expect(div.textContent).toBe("10")
        store.y = 2
        expect(div.textContent).toBe("20")
    })
})
