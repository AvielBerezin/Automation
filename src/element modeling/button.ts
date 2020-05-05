import { By, WebElement } from 'selenium-webdriver';
import { errorSome } from '../raw action manipulators';
import { rawAction } from '../core';

export type clickError<name extends string> =
  { name: name
  , msg: 'could not find element'|'not clickable element'
  , details: any };

export const clickOf: <name extends string>(name: name, locator: By) => rawAction<errorSome<clickError<name>, void>> =
  (name, locator) => async driver => {
    let element: WebElement;
    try {
      element = await driver.findElement(locator);
    }
    catch (details) {
      return (
        { type: 'error'
        , error:
          { name
          , msg: 'could not find element'
          , details } }
      );
    }
    try {
      await element.click();
      return (
        { type: 'result'
        , value: undefined }
      );
    }
    catch (details) {
      return (
        { type: 'error'
        , error: 
          { name
          , msg: 'not clickable element'
          , details } }
      );
    }
  };