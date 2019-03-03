import * as mobx from "mobx"
import * as React from "react"
import { cleanup, fireEvent, render } from "react-testing-library"

import { observer, useObservable } from "../src"

afterEach(cleanup)

describe("is used to keep observable within component body", () => {
    it("value can be changed over renders", () => {
        const TestComponent = () => {
            const obs = useObservable({
                x: 1,
                y: 2
            })
            return (
                <div onClick={() => (obs.x += 1)}>
                    {obs.x}-{obs.y}
                </div>
            )
        }
        const { container, rerender } = render(<TestComponent />)
        const div = container.querySelector("div")!
        expect(div.textContent).toBe("1-2")
        fireEvent.click(div)
        // observer not used, need to render from outside
        rerender(<TestComponent />)
        expect(div.textContent).toBe("2-2")
    })

    it("works with observer as well", () => {
        const spyObservable = jest.spyOn(mobx, "observable")

        let renderCount = 0

        const TestComponent = observer(() => {
            renderCount++

            const obs = useObservable({
                x: 1,
                y: 2
            })
            return (
                <div onClick={() => (obs.x += 1)}>
                    {obs.x}-{obs.y}
                </div>
            )
        })
        const { container } = render(<TestComponent />)
        const div = container.querySelector("div")!
        expect(div.textContent).toBe("1-2")
        fireEvent.click(div)
        expect(div.textContent).toBe("2-2")
        fireEvent.click(div)
        expect(div.textContent).toBe("3-2")

        // though render 3 times, mobx.observable only called once
        expect(renderCount).toBe(3)
        expect(spyObservable.mock.calls.length).toBe(1)

        spyObservable.mockRestore()
    })

    it("actions can be used", () => {
        const TestComponent = observer(() => {
            const obs = useObservable({
                x: 1,
                y: 2,
                inc() {
                    obs.x += 1
                }
            })
            return (
                <div onClick={obs.inc}>
                    {obs.x}-{obs.y}
                </div>
            )
        })
        const { container } = render(<TestComponent />)
        const div = container.querySelector("div")!
        expect(div.textContent).toBe("1-2")
        fireEvent.click(div)
        expect(div.textContent).toBe("2-2")
    })

    it("computed properties works as well", () => {
        const TestComponent = observer(() => {
            const obs = useObservable({
                x: 1,
                y: 2,
                get z() {
                    return obs.x + obs.y
                }
            })
            return <div onClick={() => (obs.x += 1)}>{obs.z}</div>
        })
        const { container } = render(<TestComponent />)
        const div = container.querySelector("div")!
        expect(div.textContent).toBe("3")
        fireEvent.click(div)
        expect(div.textContent).toBe("4")
    })

    it("Map can used instead of object", () => {
        const TestComponent = observer(() => {
            const map = useObservable(new Map([["initial", 10]]))
            return (
                <div onClick={() => map.set("later", 20)}>
                    {Array.from(map).map(([key, value]) => (
                        <div key={key}>
                            {key} - {value}
                        </div>
                    ))}
                </div>
            )
        })
        const { container } = render(<TestComponent />)
        const div = container.querySelector("div")!
        expect(div.textContent).toBe("initial - 10")
        fireEvent.click(div)
        expect(div.textContent).toBe("initial - 10later - 20")
    })

    it("should work with lazy initialization", () => {
        const TestComponent = () => {
            const obs = useObservable(() => ({
                x: 1,
                y: 2
            }))
            return (
                <div onClick={() => (obs.x += 1)}>
                    {obs.x}-{obs.y}
                </div>
            )
        }
        const { container, rerender } = render(<TestComponent />)
        const div = container.querySelector("div")!
        expect(div.textContent).toBe("1-2")
        fireEvent.click(div)
        // observer not used, need to render from outside
        rerender(<TestComponent />)
        expect(div.textContent).toBe("2-2")
    })
})
