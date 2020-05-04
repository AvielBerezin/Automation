import 'colors';
import { reporter, resultTree, rawAction, errorSome } from './core';
import { waitResult } from './raw action manipulators';


export type result<R> = { status: 'passed' } | { status: 'failed', reason: R }

const hasPassed: <E>(rt: resultTree<result<E>>) => Promise<boolean>
  = async resultTree =>
    resultTree.type === 'leaf'
    ? (await resultTree.result).status === 'passed'
    : await (
        resultTree.children.reduce
          ( async (passed, rt) =>
              (await passed) && (await hasPassed(rt))
          , Promise.resolve(true))
      );
export const example_reporter:<E>(resultTree: resultTree<result<E>>) => Promise<void> = 
  (function reportWithIndentation<E>(indent: number): reporter<result<E>> {
    return async resultTree => {
      const indentLog = (...args: any[]) =>
        indent === 0
        ? console.log(...args)
        : console.log(' '.repeat(indent*2-1), ...args);

      indentLog(resultTree.description.bold);
      if (await hasPassed(resultTree)) {
        indentLog('PASS'.green);
      }
      else {
        if (resultTree.type === 'leaf') {
          const result =  await resultTree.result;
          if (result.status === 'passed') {
            indentLog('PASS'.green);
          }
          else {
            indentLog
              ( 'FAILED'.red+' because '.yellow
              , result.reason );
          }
        }
        else {
          indentLog('FAILD'.red);
          await (
            resultTree.children.reduce
              ( async (p, rt) => {
                  await p;
                  await reportWithIndentation(indent+1)(rt);
                }
              , Promise.resolve() )
          );
        }
      }
    };
  })(0);

export type resultOfWait<E> = result<
  | { type: 'error'
    , details: E }
  | { type: "timed-out"
    , after: number }
  >;
export const resultOfWait: <E>(wait: rawAction<errorSome<E, waitResult>>) => rawAction<resultOfWait<E>>
  = wait => async driver => {
    const wait_result = await wait(driver);
    return (
      wait_result.type === 'error'
      ? { status: 'failed'
        , reason: 
          { type: 'error'
          , details: wait_result.error } }
      : wait_result.value.type === 'satisfied'
        ? { status: 'passed' }
        : { status: 'failed'
          , reason: wait_result.value }
    );
  };
export const resultOfVoid: <E>(action: rawAction<errorSome<E, void>>) => rawAction<result<E>>
  = action => async driver => {
    const result = await action(driver);
    return (
      result.type === 'result'
      ? { status: 'passed' }
      : { status: 'failed'
        , reason: result.error }
    );
  };
export const resultOfGotExpected: <G,E extends G>(action: rawAction<gotExpected<G,E>>) => rawAction<result<gotExpected<G,E>>>
  = action => async driver => {
    const result = await action(driver);
    return (
      result.got === result.expected
      ? { status: 'passed' }
      : { status: 'failed'
        , reason: result }
    );
  };