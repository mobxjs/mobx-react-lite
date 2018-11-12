# mobx-react-lite

[![Build Status](https://travis-ci.org/mobxjs/mobx-react-lite.svg?branch=master)](https://travis-ci.org/mobxjs/mobx-react)
[![Join the chat at https://gitter.im/mobxjs/mobx](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/mobxjs/mobx?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is a next iteration of [mobx-react](https://github.com/mobxjs/mobx-react) coming from introducing React hooks which simplifies a lot of internal workings of this package. Class based components **are not supported** except using `<Observer>` directly in its `render` method.

**You need React version 16.7.0-alpha.0 which is highly experimental and not recommended for a production.**

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

// a file with a component
function ConnectedComponent() {
    // replacement for inject
    const store = useContext(StoreContext)
}
```
