import { reaction } from "mobx"
import * as React from "react"
import { cleanup, render } from "react-testing-library"
import { observer, useObservableEffect, useObservableProps } from "../src"

afterEach(cleanup)

test("useObservableEffect", async () => {
    let reactions1 = 0
    let reactions2 = 0
    let renders = 0

    const Component = observer((nonObsProps: { prop1?: number; prop2?: number }) => {
        const props = useObservableProps(nonObsProps, "shallow")

        useObservableEffect(() =>
            reaction(
                () => props.prop1,
                () => {
                    reactions1++
                }
            )
        )

        useObservableEffect(() =>
            reaction(
                () => props.prop2,
                () => {
                    reactions2++
                }
            )
        )

        renders++
        return null
    })

    const { rerender } = render(<Component />)
    expect(renders).toBe(1)
    expect(reactions1).toBe(0)
    expect(reactions2).toBe(0)

    rerender(<Component prop1={1} />)
    expect(renders).toBe(2)
    expect(reactions1).toBe(1)
    expect(reactions2).toBe(0)

    rerender(<Component prop2={1} />)
    expect(renders).toBe(3)
    expect(reactions1).toBe(2)
    expect(reactions2).toBe(1)
})
