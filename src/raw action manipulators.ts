import { rawAction } from "./core";
import { WebDriver } from "selenium-webdriver";

export type errorSomeError<E> = { type: 'error', error: E };
export type errorSomeValue<R> = { type: 'result', value: R }
export type errorSome<E,R> = errorSomeError<E> | errorSomeValue<R>;

export type gotExpected<G,E extends G = G> = { got: G, expected: E };
export const getExpect: <G,E extends G>(expected: E, action: rawAction<G>) => rawAction<gotExpected<G,E>>
  = (expected, action) => async driver => (
    { got: await action(driver)
    , expected }
  );

type pred<E> = rawAction<errorSome<E, boolean>>
type not = <E>(pred: pred<E>) => pred<E>
export const not: not = pred => async driver => {
  const result = await pred(driver);
  return (
    result.type === 'error'
    ? result
    : { type: 'result'
      , value: !result.value }
  );
}

export type waitResult =
  | { type: 'satisfied', duration: number }
  | { type: 'timed-out', after: number };

export const waitFor
: <E>(pred: pred<E>, time: number) => rawAction<errorSome<E, waitResult>>
= <E>(pred: pred<E>, time: number) => async (driver: WebDriver) => {
  const start = Date.now();
  return new Promise<errorSome<E,waitResult>>(
    resolve => {
      let loop = function () {
        pred(driver).then(value =>
          value.type === 'error'
          ? resolve(value)
          : value.value
            ? resolve({ type: 'result', value: { type: 'satisfied', duration: Date.now()-start } })
            : setTimeout(loop, 50)
        );
      };
      setTimeout
        ( () => {
           resolve(
                { type: 'result'
                , value:
                    { type: 'timed-out'
                    , after: (Date.now()-start) } }
              );
              loop = async () => {}; }
        , time );
      loop();
    }
  );
};