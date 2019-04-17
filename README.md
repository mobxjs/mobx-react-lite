# mobx-react-lite <!-- omit in toc -->

[![Build Status](https://travis-ci.org/mobxjs/mobx-react-lite.svg?branch=master)](https://travis-ci.org/mobxjs/mobx-react-lite)[![Coverage Status](https://coveralls.io/repos/github/mobxjs/mobx-react-lite/badge.svg)](https://coveralls.io/github/mobxjs/mobx-react-lite)

[![Join the chat at https://gitter.im/mobxjs/mobx](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/mobxjs/mobx?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is a next iteration of [mobx-react](https://github.com/mobxjs/mobx-react) coming from introducing React hooks which simplifies a lot of internal workings of this package.

**You need React version 16.8.0 and above**

Class based components **are not supported** except using `<Observer>` directly in its `render` method. If you want to transition existing projects from classes to hooks (as most of us do), you can use this package alongside the [mobx-react](https://github.com/mobxjs/mobx-react) just fine. The only conflict point is about the `observer` HOC. Subscribe [to this issue](https://github.com/mobxjs/mobx-react/issues/640) for a proper migration guide.

[![NPM](https://nodei.co/npm/mobx-react-lite.png)](https://www.npmjs.com/package/mobx-react-lite)

Project is written in TypeScript and provides type safety out of the box. No Flow Type support is planned at this moment, but feel free to contribute.

-   [API documentation](#api-documentation)
    -   [`<Observer/>`](#observer)
    -   [`observer<P>(baseComponent: FunctionComponent<P>, options?: IObserverOptions): FunctionComponent<P>`](#observerpbasecomponent-functioncomponentp-options-iobserveroptions-functioncomponentp)
    -   [`useObserver<T>(fn: () => T, baseComponentName = "observed", options?: IUseObserverOptions): T`](#useobservertfn---t-basecomponentname--%22observed%22-options-iuseobserveroptions-t)
    -   [`useLocalStore<T>(initializer: () => T): T`](#uselocalstoretinitializer---t-t)
    -   [`useAsObservableSource<T>(state: T): T`](#useasobservablesourcetstate-t-t)
-   [Creating MobX reactions inside hook components](#creating-mobx-reactions-inside-hook-components)
-   [Server Side Rendering with `useStaticRendering`](#server-side-rendering-with-usestaticrendering)
-   [Why no Provider/inject?](#why-no-providerinject)

## API documentation

### `<Observer/>`

`Observer` is a React component, which applies observer to an anonymous region in your component.
It takes as children a single, argumentless function which should return exactly one React component.
The rendering in the function will be tracked and automatically re-rendered when needed.
This can come in handy when needing to pass render function to external components (for example the React Native listview), or if you want to observe only relevant parts of the output for a performance reasons.

```jsx
import { Observer, useObservable } from "mobx-react-lite"

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
import { Observer, useObservable } from "mobx-react-lite"

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

### `observer<P>(baseComponent: FunctionComponent<P>, options?: IObserverOptions): FunctionComponent<P>`

Function that converts a function component into a reactive component, which tracks which observables are used automatically re-renders the component when one of these values changes. Observables can be passed through props, accessed from context or created locally with `useObservable`.

As for options, it is an optional object with the following optional properties:

-   `forwardRef`: pass `true` to use [`forwardRef`](https://reactjs.org/docs/forwarding-refs.html) over the inner component, pass `false` (the default) otherwise.

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

### `useObserver<T>(fn: () => T, baseComponentName = "observed", options?: IUseObserverOptions): T`

Low level implementation used internally by `observer`.
It allows you to use an `observer` like behaviour, but still allowing you to optimize the component in any way you want (e.g. using `memo` with a custom `areEqual`, using `forwardRef`, etc.) and to declare exactly the part that is observed (the render phase). One good thing about this is that if any hook changes an observable for some reason then the component won't rerender twice unnecessarily.

The following optional parameters are available:

-   `baseComponentName`: a string that will be used as part of the reaction name.

As for the options, the following are available:

-   `useForceUpdate`: optional custom hook that should make a component re-render (or not) when changes are detected.

```tsx
import { memo } from "react"
import { useObserver, useObservable } from "mobx-react-lite"

const Person = memo(props => {
    const person = useObservable({ name: "John" })
    return useObserver(() => (
        <div>
            {person.name}
            <button onClick={() => (person.name = "Mike")}>No! I am Mike</button>
        </div>
    ))
})
```

### `useLocalStore<T>(initializer: () => T): T`

`useLocalStore` creates a local, observable store that is initialized once, and can be used throughout the life-cycle of the component. Use it if you want to use mobx-powered, local store.
For simple cases it is recommended to use `React.setState`, but if your component requires complex view models, consider creating a local mobx store by using this hook.

If the returned value is a plain object, it will be automatically be passed through `observable`, turning fields into observable properties, and `get` based property accessors in computed values, and functions in bound actions.

If new class instances are returned from the initializer, they will be kept as is. Quick example:

```typescript
function Counter() {
    const store = useLocalStore(() => ({
        count: 0,
        inc() {
            this.count += 1
        }
    }))

    return useObserver(() => (
        <div>
            Count: {store.count}
            <button onClick={store.inc}>Increment</button>
        </div>
    ))
}
```

It is important to realize that the store is created only once! It is not possible to specify dependencies to force re-creation, _nor should you directly be referring to props for the initializer function_, as changes in those won't propagate.

Instead, if your store needs to refer to props (or `useState` based local state), the `useLocalStore` should be combined with the `useAsObservableSource` hook, see below.

### `useAsObservableSource<T>(state: T): T`

The `useAsObservableSource` hook can be used to turn any set of values into an observable object that has a stable reference (the same object is returned every time from the hook).
The goal of this hook is to trap React primitives such as props or state into a local, observable object
so that the `store` initializer can safely refer to it, and get notified if any of the values change.

Example:

```typescript
function Counter({ multiplier }) {
    const observableProps = useAsObservableSource({ multiplier })
    const store = useLocalStore(() => ({
        count: 0,
        get multiplied() {
            return observableProps.multiplier * this.count
        },
        inc() {
            this.count += 1
        }
    }))

    return useObserver(() => (
        <div>
            Multiplied count: {store.multiplied}
            <button onClick={store.inc}>Increment</button>
        </div>
    ))
}
```

In the above example, any change to `multiplier` prop will show up in the `observableProps` observable object, and be picked up by the `store`.

Warning: _the return value of `useAsObservableSource` should never be deconstructed! So, don't write: `const {multiplier} = useAsObservableSource({ multiplier })`!_

The value passed to `useAsObservableSource` should always be an object, and is made only shallowly observable.

The object returned by `useAsObservableSource`, although observable, should be considered read-only for all practical purposes.
Use `useStore` to create local, observable, mutable, state.

## Creating MobX reactions inside hook components

If needed, it is possible to create MobX based side effects in hook based components using the standard APIs. For example:

```typescript
function Counter() {
    const store = useLocalStore(() => ({
        count: 0,
        inc() {
            store.count += 1
        }
    }))

    useEffect(
        () =>
            autorun(() => {
                document.title = "Ticked: " + store.count
            }),
        []
    )

    return /* etc */
}
```

Note that the disposer function of `autorun` should be returned to `useEffect` so that the effect is cleaned up properly by React.

Secondly, when using MobX based side effects, you typically don't want to re-create them after each rendering, so make sure to pass in an empty array `[]` as deps to `useEffect`.

This will yield the same limitation as when using `useStore`: changes to props used by the side-effect won't be picked up automatically, so don't refer to them directly. Instead, leverage `useAsObservableSource` again:

```typescript
function Counter({ prefix }) {
    const observableProps = useAsObservableSource({ prefix })
    const store = useLocalStore(() => ({
        count: 0,
        inc() {
            store.count += 1
        }
    }))

    useEffect(
        () =>
            autorun(() => {
                document.title = `${observableProps.prefix}: ${store.count}`
            }),
        []
    )

    return useObserver(() => (
        <div>
            Count: {store.count}
            <button onClick={store.inc}>Increment</button>
        </div>
    ))
}
```

## Server Side Rendering with `useStaticRendering`

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
