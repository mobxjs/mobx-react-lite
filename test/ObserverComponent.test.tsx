import * as mobx from 'mobx'
import * as React from 'react'
import { cleanup, render } from 'react-testing-library'

import { Observer } from '../src'

afterEach(cleanup)

describe("regions should rerender component", () => {
    const execute = () => {
        const data = mobx.observable.box("hi")
        const Comp = () => (
            <div>
                <Observer>{() => <span>{data.get()}</span>}</Observer>
                <li>{data.get()}</li>
            </div>
        )
        return { ...render(<Comp />), data }
    }

    test("init state is correct", () => {
        const { container } = execute()
        expect(container.querySelector("span")!.innerHTML).toBe("hi")
        expect(container.querySelector("li")!.innerHTML).toBe("hi")
    })

    test("set the data to hello", async () => {
        const { container, data } = execute()
        data.set("hello")
        expect(container.querySelector("span")!.innerHTML).toBe("hello")
        expect(container.querySelector("li")!.innerHTML).toBe("hi")
    })
})

describe("prop types checks for children/render usage", () => {
    // FALSE POSITIVE test, no error bubbles here from prop types checks
    it("allows either children or render props", () => {
        const Comp = () => (
            <div>
                <Observer render={() => <span>children</span>}>
                    {() => <span>children</span>}
                </Observer>
            </div>
        )
        render(<Comp />)
    })
})
