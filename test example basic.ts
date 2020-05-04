import { activate, passTo, sequence, elevate, reportingAction } from './core';
import { example_reporter, result, resultOfWait, resultOfVoid, resultOfGotExpected } from "./reporter example";
import { not, waitFor } from './raw action manipulators';
import { menu, minimap } from "./maps";

const openAndCloseMenu: reportingAction<result<unknown>> =
  sequence<result<unknown>>('open menu to check its labels and then close it',
    [ elevate('verify that menu button is displayed', resultOfWait(waitFor(menu.button.isDisplayed, 1000)))
    , elevate('open menu', resultOfVoid(menu.button.click))
    , elevate('wait for menu to open', resultOfWait(waitFor(menu.isDisplayed, 3000)))
    , elevate('verify that menu x is displayed', resultOfWait(waitFor(menu.x.isDisplayed, 1000)))
    , elevate('close menu', resultOfVoid(menu.x.click))
    , elevate('wait for menu to close', resultOfWait(waitFor(not(menu.isDisplayed), 5000))) ]
  );
const times = 20;
const example_reportingAction: reportingAction<result<any>> =
  sequence(`open and close menu ${times} times`,
    [ elevate('wait for google maps', resultOfWait(waitFor(minimap.isDisplayed, 3000)))
    , ...new Array(times).fill(openAndCloseMenu)
    ]
  );

activate(passTo(example_reporter, example_reportingAction));