import * as React from "react"
import { act, cleanup, render } from "react-testing-library"

import { useLocalStore, useObserver } from "../src"

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
