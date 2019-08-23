# mobx-react-lite

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
