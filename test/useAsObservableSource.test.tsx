import * as React from "react"
import { act, cleanup, render } from "react-testing-library"

import { useState } from "react"
import { useAsObservableSource, useLocalStore, useObserver } from "../src"

afterEach(cleanup)

test("base useAsObservableSource should work", () => {
    let counterRender = 0
    let observerRender = 0

    function Counter({ multiplier }: { multiplier: number }) {
        counterRender++
        const observableProps = useAsObservableSource({ multiplier })
        const store = useLocalStore(() => ({
            count: 10,
            get multiplied() {
                return observableProps.multiplier * this.count
            },
            inc() {
                this.count += 1
            }
        }))

        return useObserver(
            () => (
                observerRender++,
                (
                    <div>
                        Multiplied count: <span>{store.multiplied}</span>
                        <button id="inc" onClick={store.inc}>
                            Increment
                        </button>
                    </div>
                )
            )
        )
    }

    function Parent() {
        const [multiplier, setMultiplier] = useState(1)

        return (
            <div>
                <Counter multiplier={multiplier} />
                <button id="incmultiplier" onClick={() => setMultiplier(m => m + 1)} />
            </div>
        )
    }

    const { container } = render(<Parent />)

    expect(container.querySelector("span")!.innerHTML).toBe("10")
    expect(counterRender).toBe(1)
    expect(observerRender).toBe(1)

    act(() => {
        ;(container.querySelector("#inc")! as any).click()
    })
    expect(container.querySelector("span")!.innerHTML).toBe("11")
    expect(counterRender).toBe(2)
    expect(observerRender).toBe(2)

    act(() => {
        ;(container.querySelector("#incmultiplier")! as any).click()
    })
    expect(container.querySelector("span")!.innerHTML).toBe("22")
    expect(counterRender).toBe(4) // TODO: avoid double rendering here!
    expect(observerRender).toBe(4) // TODO: avoid double rendering here!
})
