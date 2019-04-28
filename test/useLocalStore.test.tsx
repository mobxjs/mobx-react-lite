import * as mobx from "mobx"
import * as React from "react"
import { act, cleanup, fireEvent, render } from "react-testing-library"

import { observer, useLocalStore, useObserver } from "../src"

afterEach(cleanup)

afterEach(cleanup)

test("base useLocalStore should work", () => {
    let counterRender = 0
    let observerRender = 0
    let outerStoreRef: any

    function Counter() {
        counterRender++
        const store = (outerStoreRef = useLocalStore(() => ({
            count: 0,
            count2: 0, // not used in render
            inc() {
                this.count += 1
            }
        })))

        return useObserver(() => {
            observerRender++
            return (
                <div>
                    Count: <span>{store.count}</span>
                    <button onClick={store.inc}>Increment</button>
                </div>
            )
        })
    }

    const { container } = render(<Counter />)

    expect(container.querySelector("span")!.innerHTML).toBe("0")
    expect(counterRender).toBe(1)
    expect(observerRender).toBe(1)

    act(() => {
        container.querySelector("button")!.click()
    })
    expect(container.querySelector("span")!.innerHTML).toBe("1")
    expect(counterRender).toBe(2)
    expect(observerRender).toBe(2)

    act(() => {
        outerStoreRef.count++
    })
    expect(container.querySelector("span")!.innerHTML).toBe("2")
    expect(counterRender).toBe(3)
    expect(observerRender).toBe(3)

    act(() => {
        outerStoreRef.count2++
    })
    // No re-render!
    expect(container.querySelector("span")!.innerHTML).toBe("2")
    expect(counterRender).toBe(3)
    expect(observerRender).toBe(3)
})

describe("is used to keep observable within component body", () => {
    it("value can be changed over renders", () => {
        const TestComponent = () => {
            const obs = useLocalStore(() => ({
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

    it("works with observer as well", () => {
        const spyObservable = jest.spyOn(mobx, "observable")

        let renderCount = 0

        const TestComponent = observer(() => {
            renderCount++

            const obs = useLocalStore(() => ({
                x: 1,
                y: 2
            }))
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
            const obs = useLocalStore(() => ({
                x: 1,
                y: 2,
                inc() {
                    obs.x += 1
                }
            }))
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
            const obs = useLocalStore(() => ({
                x: 1,
                y: 2,
                get z() {
                    return obs.x + obs.y
                }
            }))
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
            const map = useLocalStore(() => new Map([["initial", 10]]))
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
})
