# mobx-react-lite <!-- omit in toc -->

[![CircleCI](https://circleci.com/gh/mobxjs/mobx-react-lite.svg?style=svg)](https://circleci.com/gh/mobxjs/mobx-react-lite)[![Coverage Status](https://coveralls.io/repos/github/mobxjs/mobx-react-lite/badge.svg)](https://coveralls.io/github/mobxjs/mobx-react-lite)

[![Join the chat at https://gitter.im/mobxjs/mobx](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/mobxjs/mobx?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is a next iteration of [mobx-react](https://github.com/mobxjs/mobx-react) coming from introducing React hooks which simplifies a lot of internal workings of this package.

**You need React version 16.8.0 and above**

Class based components **are not supported** except using `<Observer>` directly in class `render` method. If you want to transition existing projects from classes to hooks (as most of us do), you can use this package alongside the [mobx-react](https://github.com/mobxjs/mobx-react) just fine. The only conflict point is about the `observer` HOC. Subscribe [to this issue](https://github.com/mobxjs/mobx-react/issues/640) for a proper migration guide.

[![NPM](https://nodei.co/npm/mobx-react-lite.png)](https://www.npmjs.com/package/mobx-react-lite)

Project is written in TypeScript and provides type safety out of the box. No Flow Type support is planned at this moment, but feel free to contribute.

## User Guide 👉 https://mobx-react.js.org

The site contains various examples and recipes for using MobX in React world. Feel free to contribute. The API reference of this package follows 👇.

## API reference ⚒

> **`<Observer>{renderFn}</Observer>`** _([user guide](https://mobx-react.js.org/observer-component))_

> **`observer<P>(baseComponent: FunctionComponent<P>, options?: IObserverOptions): FunctionComponent<P>`** _([user guide](https://mobx-react.js.org/observer-hoc))_

```ts
interface IObserverOptions {
    // Pass true to use React.forwardRef over the inner component. It's false by the default.
    forwardRef?: boolean
}
```

> **`useObserver<T>(fn: () => T, baseComponentName = "observed", options?: IUseObserverOptions): T`** _([user guide](https://mobx-react.js.org/observer-hook))_

```ts
interface IUseObserverOptions {
    // optional custom hook that should make a component re-render (or not) upon changes
    useForceUpdate: () => () => void
}
```

**`useLocalStore<T, S>(initializer: () => T, source?: S): T`** _([user guide](https://mobx-react.js.org/state-local))_

**`useAsObservableSource<T>(source: T): T`** _([user guide](https://mobx-react.js.org/state-outsourcing))_

## React Strict mode ☄

Feel free to try out `mobx-react-lite@next` which is based on latest 1.x, but contains experimental support for handling Concurrent mode in React properly.

## Optimize rendering

[Check out the elaborate explanation](https://github.com/mobxjs/mobx-react-lite/issues/153#issuecomment-490511464).

If this is something that concerns you, we have prepared files you can simply import to configure MobX to use React batched updates depending on your platform.

**React DOM:**

> import 'mobx-react-lite/optimizeForReactDom'

**React Native:**

> import 'mobx-react-lite/optimizeForReactNative'

Import one of these before any React rendering is happening, typically `index.js/ts`. For Jest tests you can utilize [setupFilesAfterEnv](https://jestjs.io/docs/en/configuration#setupfilesafterenv-array).

### Custom batched updates

Above imports are for a convenience. If you for some reason have customized version of batched updates, you can do the following instead.

```js
import { optimizeScheduler } from "mobx-react-lite"
optimizeScheduler(customBatchedUpdates)
```

## Deprecation notice ⚠

Following utilities are still available in the package, but they are deprecated and will be removed in the next major version (2.x). As such, they are not mentioned in the user guide and it's not recommend to continue using these.

---

### `useObservable<T>(initialValue: T): T`

> **Use the `useLocalStore` instead** ([user guide](https://mobx-react.js.org/state-local))

React hook that allows creating observable object within a component body and keeps track of it over renders. Gets all the benefits from [observable objects](https://mobx.js.org/refguide/object.html) including computed properties and methods. You can also use arrays, Map and Set.

Warning: With current implementation you also need to wrap your component to `observer`. It's also possible to have `useObserver` only in case you are not expecting rerender of the whole component.

```tsx
import { useObservable, useObserver } from "mobx-react-lite"

const TodoList = () => {
    const todos = useObservable(new Map<string, boolean>())
    const todoRef = React.useRef()
    const addTodo = React.useCallback(() => {
        todos.set(todoRef.current.value, false)
        todoRef.current.value = ""
    }, [])
    const toggleTodo = React.useCallback((todo: string) => {
        todos.set(todo, !todos.get(todo))
    }, [])

    return useObserver(() => (
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
    ))
}
```

#### Lazy initialization

Lazy initialization (similar to `React.useState`) is not available. In most cases your observable state should be a plain object which is cheap to create. With `useObserver` the component won't even rerender and state won't be recreated. In case you really want a more complex state or you need to use `observer`, it's very simple to use MobX directly.

```tsx
import { observer } from "mobx-react-lite"
import { observable } from "mobx"
import { useState } from "react"

const WithComplexState = observer(() => {
    const [complexState] = useState(() => observable(new HeavyState()))
    if (complexState.loading) {
        return <Loading />
    }
    return <div>{complexState.heavyName}</div>
})
```

[![Edit TodoList](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/jzj48v2xry?module=%2Fsrc%2FTodoList.tsx)

Note that if you want to track a single scalar value (string, number, boolean), you would need [a boxed value](https://mobx.js.org/refguide/boxed.html) which is not recognized by `useObservable`. However, we recommend to just `useState` instead which gives you almost same result (with slightly different API).

### `useComputed(func: () => T, inputs: ReadonlyArray<any> = []): T`

> **Use the `useLocalStore` instead** ([user guide](https://mobx-react.js.org/state-local))

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

### `useDisposable<D extends TDisposable>(disposerGenerator: () => D, inputs: ReadonlyArray<any> = []): D`

> **Use the `React.useEffect` instead** ([user guide](https://mobx-react.js.org/recipes-effects))

The disposable is any kind of function that returns another function to be called on a component unmount to clean up used resources. Use MobX related functions like [`reaction`](https://mobx.js.org/refguide/reaction.html), [`autorun`](https://mobx.js.org/refguide/autorun.html), [`when`](https://mobx.js.org/refguide/when.html), [`observe`](https://mobx.js.org/refguide/observe.html), or anything else that returns a disposer.
Returns the generated disposer for early disposal.

Example (TypeScript):

```typescript
import { reaction } from "mobx"
import { observer, useComputed, useDisposable } from "mobx-react-lite"

const Name = observer((props: { firstName: string; lastName: string }) => {
    const fullName = useComputed(() => `${props.firstName} ${props.lastName}`, [
        props.firstName,
        props.lastName
    ])

    // when the name changes then send this info to the server
    useDisposable(() =>
        reaction(
            () => fullName,
            () => {
                // send this to some server
            }
        )
    )

    // render phase
    return `Your full name is ${props.firstName} ${props.lastName}`
})
```
