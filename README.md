# mobx-react-lite

[![Build Status](https://travis-ci.org/mobxjs/mobx-react-lite.svg?branch=master)](https://travis-ci.org/mobxjs/mobx-react)
[![Join the chat at https://gitter.im/mobxjs/mobx](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/mobxjs/mobx?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is a next iteration of [mobx-react](https://github.com/mobxjs/mobx-react) coming from introducing React hooks which simplifies a lot of internal workings of this package.

**You need React version 16.7.0-alpha.0 which is highly experimental and not recommended for a production.**

[![NPM](https://nodei.co/npm/mobx-react-lite.png)](https://www.npmjs.com/package/mobx-react-lite)

The more detailed documentation will be coming later. For now you can just use `observer` & `Observer` same way as before. There is no `Provider/inject` anymore as these can be handled by `React.createContext` without extra hassle. There might be bugs, as tests are not covering all scenarios just yet. No devtools & SSR support.

Note that class based components are not supported except using `<Observer>` directly in its `render` method.

New addition to this package is a hook `useObservable`. In its essence you can use it as an replacement for `useReducer`.

```tsx
const FriendlyComponent = observer(() => {
    const friendNameRef = React.useRef()
    const data = useObservable({
        friends: [],
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

[![Edit Friendly MobX](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/jzj48v2xry?module=%2Fsrc%2FFriendlyComponent.tsx)
