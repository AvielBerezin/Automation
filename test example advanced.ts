import { activate, passTo, sequence, elevate, reportingAction } from './core';
import { example_reporter, result, resultOfWait, resultOfVoid, resultOfGotExpected } from "./reporter example";
import { not, waitFor } from './raw action manipulators';
import { menu, minimap } from "./maps";

const checkSection0Labels = 
  (Object.keys(menu.section0) as (keyof typeof menu.section0)[])
    .map(k => elevate('check label menu section0 '+k, resultOfGotExpected(menu.section0[k].label.check)));

const openPerformCloseMenu: (message: string, perform: reportingAction<result<unknown>>[]) => reportingAction<result<unknown>>
  = (message: string, perform: reportingAction<result<any>>[]) =>
    sequence<result<unknown>>(message,
      [ elevate('verify that menu button is displayed', resultOfWait(waitFor(menu.button.isDisplayed, 1000)))
      , elevate('open menu', resultOfVoid(menu.button.click))
      , elevate('wait for menu to open', resultOfWait(waitFor(menu.isDisplayed, 3000)))
      , ...perform
      , elevate('verify that menu x is displayed', resultOfWait(waitFor(menu.x.isDisplayed, 1000)))
      , elevate('close menu', resultOfVoid(menu.x.click))
      , elevate('wait for menu to close', resultOfWait(waitFor(not(menu.isDisplayed), 5000))) ]
    );

const openAndCloseMenu: reportingAction<result<unknown>> =
  openPerformCloseMenu('open and close menu', []);

const menuCheck: reportingAction<result<unknown>> =
  openPerformCloseMenu('open menu to check its labels and then close it', checkSection0Labels);

const example_reportingAction: reportingAction<result<unknown>> =
  sequence('this is a test',
    [ elevate('wait for google maps', resultOfWait(waitFor(minimap.isDisplayed, 3000)))
    , openAndCloseMenu
    , menuCheck
    , openAndCloseMenu
    ]
  );

activate(passTo(example_reporter, example_reportingAction));