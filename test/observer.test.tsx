import * as mobx from 'mobx'
import * as React from 'react'
import { cleanup, fireEvent, render } from 'react-testing-library'

import { observer, useStaticRendering } from '../src'

const getDNode = (obj, prop) => mobx._getAdministration(obj, prop)

afterEach(cleanup)

describe("nestedRendering", () => {
    const execute = () => {
        // init element
        const store = mobx.observable({
            todos: [
                {
                    completed: false,
                    title: "a"
                }
            ]
        })

        const renderings = {
            item: 0,
            list: 0
        }

        const TodoItem = observer(({ todo }: { todo: typeof store.todos[0] }) => {
            renderings.item++
            return <li>|{todo.title}</li>
        })

        const TodoList = observer(() => {
            renderings.list++
            return (
                <div>
                    <span>{store.todos.length}</span>
                    {store.todos.map((todo, idx) => (
                        <TodoItem key={idx} todo={todo} />
                    ))}
                </div>
            )
        })
        const rendered = render(<TodoList />)
        return { ...rendered, store, renderings }
    }

    test("first rendering", () => {
        const { getAllByText, renderings } = execute()
        expect(renderings.list).toBe(1)
        expect(renderings.item).toBe(1)
        expect(getAllByText("1")).toHaveLength(1)
        expect(getAllByText("|a")).toHaveLength(1)
    })

    test("inner store changed", () => {
        const { store, getAllByText, renderings } = execute()
        store.todos[0].title += "a"
        expect(renderings.list).toBe(1)
        expect(renderings.item).toBe(2)
        expect(getAllByText("1")).toHaveLength(1)
        expect(getAllByText("|aa")).toHaveLength(1)
        expect(getDNode(store, "todos").observers.size).toBe(1)
        expect(getDNode(store.todos[0], "title").observers.size).toBe(1)
    })

    test("rerendering with outer store added", () => {
        const { store, container, getAllByText, renderings } = execute()
        store.todos.push({
            completed: true,
            title: "b"
        })
        expect(container.querySelectorAll("li").length).toBe(2)
        expect(getAllByText("2")).toHaveLength(1)
        expect(getAllByText("|b")).toHaveLength(1)
        expect(renderings.list).toBe(2)
        expect(renderings.item).toBe(2)
        expect(getDNode(store.todos[1], "title").observers.size).toBe(1)
        expect(getDNode(store.todos[1], "completed").observers.size).toBe(0)
    })

    test("rerendering with outer store pop", () => {
        const { store, container, renderings } = execute()
        const oldTodo = store.todos.pop()
        expect(renderings.list).toBe(2)
        expect(renderings.item).toBe(1)
        expect(container.querySelectorAll("li").length).toBe(0)
        expect(getDNode(oldTodo, "title").observers.size).toBe(0)
        expect(getDNode(oldTodo, "completed").observers.size).toBe(0)
    })
})

describe("isObjectShallowModified detects when React will update the component", () => {
    const store = mobx.observable({ count: 0 })
    let counterRenderings = 0
    const Counter = observer(function TodoItem() {
        counterRenderings++
        return <div>{store.count}</div>
    })

    test("does not assume React will update due to NaN prop", () => {
        // @ts-ignore Not sure what this test does, the value is not used
        render(<Counter value={NaN} />)
        store.count++
        expect(counterRenderings).toBe(2)
    })
})

describe("keep views alive", () => {
    const execute = () => {
        const data = mobx.observable({
            x: 3,
            yCalcCount: 0,
            get y() {
                this.yCalcCount++
                return this.x * 2
            },
            z: "hi"
        })
        const TestComponent = observer(() => {
            return (
                <div>
                    {data.z}
                    {data.y}
                </div>
            )
        })
        return { ...render(<TestComponent />), data }
    }

    test("init state", () => {
        const { data, queryByText } = execute()
        expect(data.yCalcCount).toBe(1)
        expect(queryByText("hi6")).toBeTruthy()
    })

    test("rerender should not need a recomputation of data.y", () => {
        const { data, queryByText } = execute()
        data.z = "hello"
        expect(data.yCalcCount).toBe(1)
        expect(queryByText("hello6")).toBeTruthy()
    })
})

describe("does not keep views alive when using static rendering", () => {
    const execute = () => {
        useStaticRendering(true)
        let renderCount = 0
        const data = mobx.observable({
            z: "hi"
        })

        const TestComponent = observer(() => {
            renderCount++
            return <div>{data.z}</div>
        })

        return { ...render(<TestComponent />), data, getRenderCount: () => renderCount }
    }

    afterEach(() => {
        useStaticRendering(false)
    })

    test("init state is correct", () => {
        const { getRenderCount, getByText } = execute()
        expect(getRenderCount()).toBe(1)
        expect(getByText("hi")).toBeTruthy()
    })

    test("no re-rendering on static rendering", () => {
        const { getRenderCount, getByText, data } = execute()
        data.z = "hello"
        expect(getRenderCount()).toBe(1)
        expect(getByText("hi")).toBeTruthy()
        expect(getDNode(data, "z").observers.size).toBe(0)
    })
})

describe("issue 12", () => {
    const createData = () =>
        mobx.observable({
            selected: "coffee",
            items: [
                {
                    name: "coffee"
                },
                {
                    name: "tea"
                }
            ]
        })

    const Row: React.FC<{ item: { name: string }; selected: string }> = props => {
        return (
            <span>
                {props.item.name}
                {props.selected === props.item.name ? "!" : ""}
            </span>
        )
    }
    /** table stateles component */
    const Table: React.FC<{ data: any }> = observer(props => {
        return (
            <div>
                {props.data.items.map(item => (
                    <Row key={item.name} item={item} selected={props.data.selected} />
                ))}
            </div>
        )
    })

    test("init state is correct", () => {
        const data = createData()
        const { container } = render(<Table data={data} />)
        expect(container).toMatchInlineSnapshot(`
<div>
  <div>
    <span>
      coffee
      !
    </span>
    <span>
      tea
      
    </span>
  </div>
</div>
`)
    })

    test("run transaction", () => {
        const data = createData()
        const { container } = render(<Table data={data} />)
        mobx.transaction(() => {
            data.items[1].name = "boe"
            data.items.splice(0, 2, { name: "soup" })
            data.selected = "tea"
        })
        expect(container).toMatchInlineSnapshot(`
<div>
  <div>
    <span>
      soup
      
    </span>
  </div>
</div>
`)
    })
})

test("changing state in render should fail", () => {
    // This test is most likely obsolete ... exception is not thrown
    const data = mobx.observable.box(2)
    const Comp = observer(() => {
        if (data.get() === 3) {
            try {
                data.set(4) // wouldn't throw first time for lack of observers.. (could we tighten this?)
            } catch (err) {
                expect(
                    /Side effects like changing state are not allowed at this point/.test(err)
                ).toBeTruthy()
            }
        }
        return <div>{data.get()}</div>
    })
    const { container } = render(<Comp />)
    data.set(3)
    expect(container).toMatchInlineSnapshot(`
<div>
  <div>
    4
  </div>
</div>
`)
    mobx._resetGlobalState()
})

describe("should render component even if setState called with exactly the same props", () => {
    const execute = () => {
        let renderCount = 0
        const Component = observer(() => {
            const [, setState] = React.useState({})
            const onClick = () => {
                setState({})
            }
            renderCount++
            return <div onClick={onClick} data-testid="clickableDiv" />
        })
        return { ...render(<Component />), getCount: () => renderCount }
    }

    test("renderCount === 1", () => {
        const { getCount } = execute()
        expect(getCount()).toBe(1)
    })

    test("after click once renderCount === 2", async () => {
        const { getCount, getByTestId } = execute()
        fireEvent.click(getByTestId("clickableDiv"))
        expect(getCount()).toBe(2)
    })

    test("after click twice renderCount === 3", async () => {
        const { getCount, getByTestId } = execute()
        fireEvent.click(getByTestId("clickableDiv"))
        fireEvent.click(getByTestId("clickableDiv"))
        expect(getCount()).toBe(3)
    })
})

// describe.only("it rerenders correctly if some props are non-observables - 1", () => {
//     const execute = () => {
//         let renderCount = 0
//         const createProps = () => {
//             const odata = mobx.observable({ x: 1 })
//             const data = { y: 1 }
//             function doStuff() {
//                 data.y++
//                 odata.x++
//             }
//             return { odata, data, doStuff }
//         }

//         const Component = props => {
//             const computed = useObservable(() => props.odata.x)

//             renderCount++
//             return (
//                 <span onClick={props.doStuff}>
//                     {props.odata.x}-{props.data.y}-{computed}
//                 </span>
//             )
//         }

//         const Parent = observer((props: any) => {
//             // @ts-ignore props
//             return <Component {...props} />
//         })

//         const rendered = render(<Parent {...createProps()} />)
//         return {
//             ...rendered,
//             getCount: () => renderCount,
//             span: rendered.container.querySelector("span")!
//         }
//     }

//     test("init renderCount === 1", () => {
//         const { span, getCount } = execute()
//         expect(getCount()).toBe(1)
//         expect(span.innerHTML).toBe("1-1-1")
//     })

//     test("after click renderCount === 2", async () => {
//         const { span, getCount } = execute()
//         fireEvent.click(span)
//         expect(getCount()).toBe(2)
//         expect(span.innerHTML).toBe("2-2-2")
//     })

//     test("after click twice renderCount === 3", async () => {
//         const { span, getCount } = execute()
//         fireEvent.click(span)
//         fireEvent.click(span)
//         expect(getCount()).toBe(3)
//         expect(span.innerHTML).toBe("3-3-3")
//     })
// })

// describe("it rerenders correctly if some props are non-observables - 2", () => {
//     let renderCount = 0
//     let odata = mobx.observable({ x: 1 })

//     @observer
//     class Component extends React.Component {
//         @mobx.computed
//         get computed() {
//             return this.props.data.y // should recompute, since props.data is changed
//         }

//         render() {
//             renderCount++
//             return (
//                 <span onClick={stuff}>
//                     {this.props.data.y}-{this.computed}
//                 </span>
//             )
//         }
//     }

//     const Parent = observer(props => {
//         let data = { y: props.odata.x }
//         return <Component data={data} odata={props.odata} />
//     })

//     function stuff() {
//         odata.x++
//     }

//     mobx.reaction(
//         () => odata.x,
//         v => {
//             // console.log(v)
//         }
//     )

//     beforeAll(async done => {
//         await asyncReactDOMRender(<Parent odata={odata} />, testRoot)
//         done()
//     })

//     test("init renderCount === 1", () => {
//         expect(renderCount).toBe(1)
//         expect(testRoot.querySelector("span").innerHTML).toBe("1-1")
//     })

//     test("after click renderCount === 2", async () => {
//         testRoot.querySelector("span").click()
//         await sleepHelper(100)
//         expect(renderCount).toBe(2)
//         expect(testRoot.querySelector("span").innerHTML).toBe("2-2")
//     })

//     test("after click renderCount === 3", async () => {
//         testRoot.querySelector("span").click()
//         await sleepHelper(10)
//         expect(renderCount).toBe(3)
//         expect(testRoot.querySelector("span").innerHTML).toBe("3-3")
//     })
// })

// describe("Observer regions should react", () => {
//     const data = mobx.observable.box("hi")
//     const Comp = () => (
//         <div>
//             <Observer>{() => <span>{data.get()}</span>}</Observer>
//             <li>{data.get()}</li>
//         </div>
//     )

//     beforeAll(async done => {
//         await asyncReactDOMRender(<Comp />, testRoot)
//         done()
//     })

//     test("init state is correct", () => {
//         expect(testRoot.querySelector("span").innerHTML).toBe("hi")
//         expect(testRoot.querySelector("li").innerHTML).toBe("hi")
//     })

//     test("set the data to hello", async () => {
//         data.set("hello")
//         await sleepHelper(10)
//         expect(testRoot.querySelector("span").innerHTML).toBe("hello")
//         expect(testRoot.querySelector("li").innerHTML).toBe("hi")
//     })
// })

// describe("Observer should not re-render on shallow equal new props", () => {
//     let childRendering = 0
//     let parentRendering = 0
//     const data = { x: 1 }
//     const odata = mobx.observable({ y: 1 })

//     const Child = observer(({ data }) => {
//         childRendering++
//         return <span>{data.x}</span>
//     })
//     const Parent = observer(() => {
//         parentRendering++
//         odata.y /// depend
//         return <Child data={data} />
//     })

//     beforeAll(async () => {
//         await asyncReactDOMRender(<Parent />, testRoot)
//     })

//     test("init state is correct", () => {
//         expect(parentRendering).toBe(1)
//         expect(childRendering).toBe(1)
//         expect(testRoot.querySelector("span").innerHTML).toBe("1")
//     })

//     test("after odata change", async () => {
//         odata.y++
//         sleepHelper(10)
//         expect(parentRendering).toBe(2)
//         expect(childRendering).toBe(1)
//         expect(testRoot.querySelector("span").innerHTML).toBe("1")
//     })
// })

// test("parent / childs render in the right order", done => {
//     // See: https://jsfiddle.net/gkaemmer/q1kv7hbL/13/
//     let events = []

//     class User {
//         @mobx.observable
//         name = "User's name"
//     }

//     class Store {
//         @mobx.observable
//         user = new User()
//         @mobx.action
//         logout() {
//             this.user = null
//         }
//     }

//     function tryLogout() {
//         try {
//             // ReactDOM.unstable_batchedUpdates(() => {
//             store.logout()
//             expect(true).toBeTruthy(true)
//             // });
//         } catch (e) {
//             // t.fail(e)
//         }
//     }

//     const store = new Store()

//     const Parent = observer(() => {
//         events.push("parent")
//         if (!store.user) return <span>Not logged in.</span>
//         return (
//             <div>
//                 <Child />
//                 <button onClick={tryLogout}>Logout</button>
//             </div>
//         )
//     })

//     const Child = observer(() => {
//         events.push("child")
//         return <span>Logged in as: {store.user.name}</span>
//     })

//     const container = TestUtils.renderIntoDocument(<Parent />)

//     debugger
//     tryLogout()
//     expect(events).toEqual(["parent", "child", "parent"])
//     done()
// })

// describe("206 - @observer should produce usefull errors if it throws", () => {
//     const data = mobx.observable({ x: 1 })
//     let renderCount = 0

//     const emmitedErrors = []
//     const disposeErrorsHandler = onError(error => {
//         emmitedErrors.push(error)
//     })

//     @observer
//     class Child extends React.Component {
//         render() {
//             renderCount++
//             if (data.x === 42) throw new Error("Oops!")
//             return <span>{data.x}</span>
//         }
//     }

//     beforeAll(async done => {
//         await asyncReactDOMRender(<Child />, testRoot)
//         done()
//     })

//     test("init renderCount should === 1", () => {
//         expect(renderCount).toBe(1)
//     })

//     test("catch exception", () => {
//         expect(() => {
//             withConsole(() => {
//                 data.x = 42
//             })
//         }).toThrow(/Oops!/)
//         expect(renderCount).toBe(3) // React fiber will try to replay the rendering, so the exception gets thrown a second time
//     })

//     test("component recovers!", async () => {
//         await sleepHelper(500)
//         data.x = 3
//         TestUtils.renderIntoDocument(<Child />)
//         expect(renderCount).toBe(4)
//         expect(emmitedErrors).toEqual([new Error("Oops!"), new Error("Oops!")]) // see above comment
//     })
// })

// test("195 - async componentWillMount does not work", async () => {
//     const renderedValues = []

//     @observer
//     class WillMount extends React.Component {
//         @mobx.observable
//         counter = 0

//         @mobx.action
//         inc = () => this.counter++

//         componentWillMount() {
//             setTimeout(() => this.inc(), 300)
//         }

//         render() {
//             renderedValues.push(this.counter)
//             return (
//                 <p>
//                     {this.counter}
//                     <button onClick={this.inc}>+</button>
//                 </p>
//             )
//         }
//     }
//     TestUtils.renderIntoDocument(<WillMount />)

//     await sleepHelper(500)
//     expect(renderedValues).toEqual([0, 1])
// })

// test.skip("195 - should throw if trying to overwrite lifecycle methods", () => {
//     // Test disabled, see #231...

//     @observer
//     class WillMount extends React.Component {
//         componentWillMount = () => {}

//         render() {
//             return null
//         }
//     }
//     expect(TestUtils.renderIntoDocument(<WillMount />)).toThrow(
//         /Cannot assign to read only property 'componentWillMount'/
//     )
// })

// describe("use Observer inject and render sugar should work  ", () => {
//     test("use render without inject should be correct", async () => {
//         const Comp = () => (
//             <div>
//                 <Observer render={props => <span>{123}</span>} />
//             </div>
//         )
//         await asyncReactDOMRender(<Comp />, testRoot)
//         expect(testRoot.querySelector("span").innerHTML).toBe("123")
//     })

//     test("use children without inject should be correct", async () => {
//         const Comp = () => (
//             <div>
//                 <Observer>{props => <span>{123}</span>}</Observer>
//             </div>
//         )
//         await asyncReactDOMRender(<Comp />, testRoot)
//         expect(testRoot.querySelector("span").innerHTML).toBe("123")
//     })

//     test("show error when using children and render at same time ", async () => {
//         const msg = []
//         const baseError = console.error
//         console.error = m => msg.push(m)

//         const Comp = () => (
//             <div>
//                 <Observer render={() => <span>{123}</span>}>{() => <span>{123}</span>}</Observer>
//             </div>
//         )

//         await asyncReactDOMRender(<Comp />, testRoot)
//         expect(msg.length).toBe(1)
//         console.error = baseError
//     })
// })

// test("don't use PureComponent", () => {
//     const msg = []
//     const baseWarn = console.warn
//     console.warn = m => msg.push(m)

//     try {
//         debugger
//         observer(
//             class X extends React.PureComponent {
//                 return() {
//                     return <div />
//                 }
//             }
//         )

//         expect(msg).toEqual([
//             "Mobx observer: You are using 'observer' on React.PureComponent. These two achieve two opposite goals and should not be used together"
//         ])
//     } finally {
//         console.warn = baseWarn
//     }
// })

// test("static on function components are hoisted", () => {
//     const Comp = () => <div />
//     Comp.foo = 3

//     const Comp2 = observer(Comp)

//     expect(Comp2.foo).toBe(3)
// })
