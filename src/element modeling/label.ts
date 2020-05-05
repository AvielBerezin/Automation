import { By } from 'selenium-webdriver';
import { gotExpected, errorSome } from '../raw action manipulators';
import { rawAction } from '../core';

export type label = {
  text: rawAction<string>;
  check: rawAction<gotExpected<string>>;
};

export type textError<name extends string> =
  { msg: 'could not find element'|'could not get text'
  , name: name
  , details: any };

export const textOf
  : <name extends string>(name: name, locator: By) => rawAction<errorSome<textError<name>, string>>
  = (name, locator) => async driver => {
    let element;
    try {
      element = await driver.findElement(locator);
    }
    catch (details) {
      return (
        { type: 'error'
        , error:
          { msg: 'could not find element'
          , name
          , details } }
      );
    }
    try {
      return (
        { type: 'result'
        , value: await element.getText() }
      );
    }
    catch (details) {
      return (
        { type: 'error'
        , error:
          { name
          , msg: 'could not get text'
          , details } }
      );
    }
  };