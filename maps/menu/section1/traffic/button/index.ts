// generated by "src\ts\meta\file generators\map menu sections 0 to 2 options.ts"

import { clickOf, clickError as clickErrorOf } from '../../../../../../../src/ts/maps factory/button';
import { isDisplayedOf, displayError as displayErrorOf } from '../../../../../../../src/ts/maps factory/element';
import { rawAction, errorSome } from '../../../../../../../src/ts/action layer and reporting tree';
import { button as locator } from './locators';

const name = 'traffic button';

export type clickError = clickErrorOf<typeof name>;
export type displayError = displayErrorOf<typeof name>;

export const click: rawAction<errorSome<clickError, void>> = clickOf(name, locator);
export const isDisplayed: rawAction<errorSome<displayError, boolean>> = isDisplayedOf(name, locator);