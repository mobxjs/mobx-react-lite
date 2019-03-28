// @ts-ignore
import plugin from "babel-plugin-macros"
// @ts-ignore
import pluginTester from "babel-plugin-tester"

pluginTester({
    plugin,
    snapshot: true,
    babelOptions: { filename: __filename },
    tests: [
        `
      import {useObserver} from './useCustomObserver.macro'

      export const MyComponent = (props) => {
        const {useObservable, useComputed} = useObserver();
        const foo = useObservable({foo: 1});
        const bar = useComputed(() => foo.foo + 1);
        return null;
      };

      export const MyComponent2 = (props) => {
        // a comment
        const {useObservable} = useObserver();
        const foo = useObservable({foo: 1});
        return null;
      };

      export const MyComponent3 = (props) => {
        useObserver();
        return null;
      };

      `
    ]
})
