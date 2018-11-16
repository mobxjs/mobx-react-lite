# mobx-react-lite

[![Build Status](https://travis-ci.org/mobxjs/mobx-react-lite.svg?branch=master)](https://travis-ci.org/mobxjs/mobx-react)
[![Join the chat at https://gitter.im/mobxjs/mobx](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/mobxjs/mobx?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is a next iteration of [mobx-react](https://github.com/mobxjs/mobx-react) coming from introducing React hooks which simplifies a lot of internal workings of this package. Class based components **are not supported** except using `<Observer>` directly in its `render` method.

**You need React version 16.7.0-alpha.2 which is highly experimental and not recommended for a production.**

[![NPM](https://nodei.co/npm/mobx-react-lite.png)](https://www.npmjs.com/package/mobx-react-lite)

Project is written in TypeScript and provides type safety out of the box. No Flow Type support is planned at this moment, but feel free to contribute.

## API documentation

### observer(componentClass)

Function that converts a function component into a reactive component, which tracks which observables are used automatically re-renders the component when one of these values changes. Observables can be passed through props, accessed from context or created locally with `useObservable`.

```tsx
import { observer, useObservable } from "mobx-react-lite"

const FriendlyComponent = observer(() => {
    const friendNameRef = React.useRef()
    const data = useObservable({
        friends: [] as string[],
        addFriend(favorite: boolean = false) {
            if (favorite === true) {
                data.friends.unshift(friendNameRef.current.value + " * ")
            } else {
                data.friends.push(friendNameRef.current.value)
            }
            friendNameRef.current.value = ""
        },
        get friendsCount() {
            return data.friends.length
        }
    })

    return (
        <div>
            <b>Count of friends: {data.friendsCount} </b>
            {data.friends.map(friend => (
                <div>{friend}</div>
            ))}
            <hr />
            <input ref={friendNameRef} />
            <button onClick={data.addFriend}>Add friend </button>
            <button onClick={() => data.addFriend(true)}>Add favorite friend</button>
        </div>
    )
})
```

[![Edit FriendlyComponent](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/jzj48v2xry?module=%2Fsrc%2FFriendlyComponent.tsx)

### `Observer`

`Observer` is a React component, which applies `observer` to an anonymous region in your component.
It takes as children a single, argumentless function which should return exactly one React component.
The rendering in the function will be tracked and automatically re-rendered when needed.
This can come in handy when needing to pass render function to external components (for example the React Native listview), or if you
dislike the `observer` function.

```jsx
import { Observer } from "mobx-react-lite"

function ObservePerson(props) {
    const person = useObservable({ name: "John" })
    return (
        <div>
            {person.name}
            <Observer>{() => <div>{person.name}</div>}</Observer>
            <button onClick={() => (person.name = "Mike")}>No! I am Mike</button>
        </div>
    )
}
```

[![Edit ObservePerson](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/jzj48v2xry?module=%2Fsrc%2FObservePerson.tsx)

In case you are a fan of render props, you can use that instead of children. Be advised, that you cannot use both approaches at once, children have a precedence.
Example

```jsx
import { Observer } from "mobx-react-lite"

function ObservePerson(props) {
    const person = useObservable({ name: "John" })
    return (
        <div>
            {person.name}
            <Observer render={() => <div>{person.name}</div>} />
            <button onClick={() => (person.name = "Mike")}>No! I am Mike</button>
        </div>
    )
}
```

### useObservable

React hook that allows creating observable object within a component body and keeps track of it over renders. Gets all the benefits from [observable objects](https://mobx.js.org/refguide/object.html) including computed properties and methods. You can also use arrays and Map which are useful to track dynamic list/table of information. The Set is not supported (see https://github.com/mobxjs/mobx/issues/69).

Warning: With current implementation you also need to wrap your component to `observer` otherwise the rerender on update won't happen.

```tsx
import { observer, useObservable } from "mobx-react-lite"

const TodoList = observer(() => {
    const todos = useObservable(new Map<string, boolean>())
    const todoRef = React.useRef()
    const addTodo = React.useCallback(() => {
        todos.set(todoRef.current.value, false)
        todoRef.current.value = ""
    }, [])
    const toggleTodo = React.useCallback((todo: string) => {
        todos.set(todo, !todos.get(todo))
    }, [])

    return (
        <div>
            {Array.from(todos).map(([todo, done]) => (
                <div onClick={() => toggleTodo(todo)} key={todo}>
                    {todo}
                    {done ? " ✔" : " ⏲"}
                </div>
            ))}
            <input ref={todoRef} />
            <button onClick={addTodo}>Add todo</button>
        </div>
    )
})
```

[![Edit TodoList](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/jzj48v2xry?module=%2Fsrc%2FTodoList.tsx)

Note that if you want to track a single scalar value (string, number, boolean), you would need [a boxed value](https://mobx.js.org/refguide/boxed.html) which is not recognized by `useObservable`. However, we recommend to just `useState` instead which gives you almost same result (with slightly different API).

### useComputed

Another React hook that simplifies computational logic. It's just a tiny wrapper around [MobX computed](https://mobx.js.org/refguide/computed-decorator.html#-computed-expression-as-function) function that runs computation whenever observable values change. In conjuction with `observer` the component will rerender based on such a change.

```tsx
const Calculator = observer(({ hasExploded }: { hasExploded: boolean }) => {
    const inputRef = React.useRef()
    const inputs = useObservable([1, 3, 5])
    const result = useComputed(
        () => (hasExploded ? "💣" : inputs.reduce(multiply, 1) * Number(!hasExploded)),
        [hasExploded]
    )

    return (
        <div>
            <input ref={inputRef} />
            <button onClick={() => inputs.push(parseInt(inputRef.current.value) | 1)}>
                Multiply
            </button>
            <div>
                {inputs.join(" * ")} = {result}
            </div>
        </div>
    )
})
```

Notice that since the computation depends on non-observable value, it has to be passed as a second argument to `useComputed`. There is [React `useMemo`](https://reactjs.org/docs/hooks-reference.html#usememo) behind the scenes and all rules applies here as well except you don't need to specify dependency on observable values.

[![Edit Calculator](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/jzj48v2xry?module=%2Fsrc%2FCalculator.tsx)

### Server Side Rendering with `useStaticRendering`

When using server side rendering, the components are rendered only once.
Since components are never unmounted, `observer` components would in this case leak memory when being rendered server side.
To avoid leaking memory, call `useStaticRendering(true)` when using server side rendering which essentially disables observer.

```js
import { useStaticRendering } from "mobx-react-lite"

useStaticRendering(true)
```

This makes sure the component won't try to react to any future data changes.

## Why no Provider/inject?

Historically the Provider was useful because a lot of boilerplate was required due to experimental (but widely used) context. By introducing new [Context API](https://reactjs.org/docs/context.html) in React 16.3 it's fairly easy to do this.

```js
const StoreContext = React.createContext(createStore())

// a file with a component
function ConnectedComponent() {
    // replacement for inject
    const store = useContext(StoreContext)
}
```

If you need to create a store sometimes later, you can just render `StoreContext.Provider` somewhere in tree.

```js
const StoreContext = React.createContext()

function App({ children }) {
    return <StoreContext.Provider value={createStore()}>{children}</StoreContext.Provider>
}
```

### What about smart/dumb components?

The React hooks don't force anyone to suddenly have a state inside a _dumb component_ that is supposed to only render stuff. You can separate your concerns in a similar fashion.

```tsx
import { createSelector } from 'react-selector-hooks'

const userSelector = createSelector(({ user ) => ({
    name: user.name,
    age: user.age
}))

function UiComponent({ name, age }) {
    return (
        <div>
            <div>Name: {name}</div>
            <div>Age: {age}</div>
        </div>
    )
}

export default () => {
    // you may extract these two lines into a custom hook
    const store = useContext(StoreContext)
    const data = userSelector(store)
    return UiComponent({...data})
    // perhaps wrap it inside observer in here?
    return observer(UiComponent({...data}))
}
```

It may look a bit more verbose than a _classic_ inject, but there is nothing stopping you to make your own `inject` HOC which is so much easier since everything is just a funciton.

```tsx
// make universal HOC

function inject(useSelector, baseComponent) {
    const store = useContext(StoreContext)
    const selected = useSelector(store)
    // optional memo essentially making a pure component
    return React.memo(props => baseComponent({ ...selected, ...props }))
}

// use the HOC with a selector

export default inject(userSelector, UiComponent)
```
