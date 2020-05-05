import { WebDriver, Builder } from "selenium-webdriver";


export type reporter<R> = (resultTree: resultTree<R>) => Promise<void>;
export type rawAction<R> = (driver: WebDriver) => Promise<R>;

export type treeNodeType = 'leaf' | 'node';

// behold: an UGLY list of repetitive type declerations which I almost could abstract

type describable = { description: string };

type ofer<thing, choise extends keyof thing> =
  { [ key in keyof thing ]
      : thing[key] & { type: key }
  } [choise];

type _resultTree<R> =
  { leaf: describable & { result: Promise<R> }
  , node: describable & { children: resultTree<R>[] } };
export type resultTreeOf<R, T extends treeNodeType> = ofer<_resultTree<R>, T>;
export type resultTree<R> = resultTreeOf<R, treeNodeType>;

type _actionTree<R> =
  { leaf: describable & { action: rawAction<R> }
  , node: describable & { children: actionTree<R>[] } };
export type actionTreeOf<R, T extends treeNodeType> = ofer<_actionTree<R>, T>
export type actionTree<R> = actionTreeOf<R, treeNodeType>;

type reportingActionDataMutual<R> =
  describable & { reporters: reporter<R>[] }
type _reportingAction<R> =
  { leaf: reportingActionDataMutual<R> & { action: rawAction<R> }
  , node: reportingActionDataMutual<R> & { children: reportingAction<R>[] }}
export type reportingActionOf<R, T extends treeNodeType> = ofer<_reportingAction<R>, T>;
export type reportingAction<R> = reportingActionOf<R, treeNodeType>;


type elevator = <R>(description: string, rawAction: rawAction<R>) => reportingAction<R>;
type sequencer = <R>(description: string, rpas: reportingAction<R>[]) => reportingAction<R>;

type passToerOf<R, T extends treeNodeType> = (reporter: reporter<R>, reportingAction: reportingActionOf<R,T>) => reportingActionOf<R,T>
type passToer<R> = passToerOf<R, treeNodeType>;

type activator<R> = (reportingAction: reportingAction<R>) => Promise<void>;



export const elevate: elevator = (description, rawAction) => ({ type: 'leaf', description, action: rawAction, reporters: [] });

export const sequence: sequencer = (description, reportingActions) => ({ type: 'node', description, children: reportingActions, reporters: [] });

export const passTo: passToer<unknown> = (reporter, reportingAction) => (
  reportingAction.type === 'leaf'
  ? passToLeaf(reporter, reportingAction)
  : passToInnerNode(reporter, reportingAction)
);
const passToLeaf: passToerOf<unknown, 'leaf'> =
  (reporter, {type, description, action, reporters}) => (
    {type, description, action, reporters: [reporter, ...reporters]}
  );
const passToInnerNode: passToerOf<unknown, 'node'> =
  (reporter, {type, description, children, reporters}) => (
    {type, description, children, reporters: [reporter, ...reporters]}
  );

const flatten = <T>(arr: T[][]) => arr.reduce((acc, cur) => [...acc, ...cur], [] as T[]);
const allChildren: <R>(at: actionTree<R>, path?: number[]) => [rawAction<R>, number[]][]
  = (actionTree, path = []) =>
    actionTree.type === 'leaf'
    ? [[ actionTree.action, path ]]
    : flatten(actionTree.children.map((atc,i) => allChildren(atc, [...path, i])))
const chain: <R>(rwaps: [rawAction<R>, number[]][], d: WebDriver) => Promise<R>[]
= <R>(rawActionWithPaths: [rawAction<R>, number[]][], driver: WebDriver) => {
  const promises: Promise<R>[] = [];
  if (rawActionWithPaths.length === 0) {
    return [];
  }
  else if (rawActionWithPaths.length === 1) {
    return [
      rawActionWithPaths[0][0](driver)
        .catch(error => Promise.reject(
          { error: 'Raw action throws an error but should not.'
          , details: error
          , path: rawActionWithPaths[0][1] }
        ))
    ];
  }
  else {
    promises.push(rawActionWithPaths[0][0](driver));
    for (let i = 1; i < rawActionWithPaths.length; i++) {
      promises.push(
        promises[i-1].then(
          () => rawActionWithPaths[i][0](driver)
            .catch(error => Promise.reject(
              { error: 'Raw action throws an error but should not.'
              , details: error
              , path: rawActionWithPaths[0][1] }
            ))
        )
      );
    }
    return promises;
  }
};
const constructResultTree: <R>(reportingAction: actionTree<R>, driver: WebDriver) => resultTree<R>
= <R>(reportingAction: actionTree<R>, driver: WebDriver) => {
  const results = chain(allChildren(reportingAction), driver);
  const constructResultTree
    : (reportingAction: actionTree<R>) => resultTree<R>
    = (reportingAction) =>
      reportingAction.type === 'leaf'
      ? constructResultTreeLeaf(reportingAction)
      : constructResultTreeNode(reportingAction);
  const constructResultTreeLeaf
    : (actionTreeLeaf: actionTreeOf<R, 'leaf'>) => resultTreeOf<R, 'leaf'>
    = ({ type, description }) => (
      { type
      , description
      , result: (results.shift() as Promise<R>) }
    );
  const constructResultTreeNode
    : (actionTreeInnerNode: actionTreeOf<R, 'node'>) => resultTreeOf<R, 'node'>
    = ({ type, description, children }) => (
      { type
      , description
      , children: children
          .reduce
            ( (children, reportingAction) =>
                [ ...children
                , constructResultTree(reportingAction) ]
            , [] as resultTree<R>[] ) }
    );
  return constructResultTree(reportingAction);
};



export const activate: activator<unknown> = async <R>(reportingAction: reportingAction<R>) => {
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    try {
      await driver.get('https://www.google.com/maps?hl=en');
    }
    catch (err) {
      console.error('could not load google maps.');
      console.error('details:', err);
      return;
    }

    let resultTree: resultTree<R>;
    try {
      resultTree = constructResultTree(reportingAction, driver);
    }
    catch (err) {
      console.error('utility: could not construct result tree');
      console.error('details:', err);
      return;
    }

    try {
      function report(rpa: reportingAction<R>, rt: resultTree<R>): Promise<void>[] {
        const reportersPromise = rpa.reporters.map(reporter => reporter(rt));
        if (rpa.type === 'node' && rt.type === 'node') {
          return reportersPromise.concat(...rpa.children.map((rpa,i) => report(rpa, rt.children[i])));
        }
        return reportersPromise;
      }
      await Promise.all(report(reportingAction, resultTree));
    }
    catch (err) {
      console.error('reporters error:', err);
    }

    try {
      function resultsToWaitFor(rt: resultTree<R>): Promise<R>[] {
        if (rt.type === "leaf") {
          return [rt.result];
        }
        else {
          return ([] as Promise<R>[]).concat(...rt.children.map(resultsToWaitFor));
        }
      }
      await Promise.all(resultsToWaitFor(resultTree));
    }
    catch (err) {
      console.error('bad action: rejected on action:', err);
    }
  }
  finally {
    await driver.close();
  }
};