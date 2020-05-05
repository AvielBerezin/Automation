import { By } from 'selenium-webdriver';
import { errorSome } from '../raw action manipulators';
import { rawAction } from '../core';

export type displayError<name extends string> =
  { name: name
  , msg: 'could not search for element'|'could not check element for visibility'
  , details: any };

export const isDisplayedOf: <name extends string>(name: name, locator: By) => rawAction<errorSome<displayError<name>, boolean>>
  = (name, locator) => async driver => {
    let elements;
    try {
      elements = await driver.findElements(locator);
    }
    catch (details) {
      return (
        { type: 'error'
        , error:
          { name
          , msg: 'could not search for element'
          , details } }
      );
    }
    let results;
    try {
      results = elements.map(e => e.isDisplayed());
    }
    catch (details) {
      return (
        { type: 'error'
        , error:
          { name
          , msg: 'could not check element for visibility'
          , details } }
      );
    }
    results = await Promise.all(results);
    const value = results.reduce((x,y) => x||y, false); 
    return (
      { type: 'result'
      , value }
    );
  };