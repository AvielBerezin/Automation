import button from './button';
import x from './x';
import * as section0 from './section0';
import * as section1 from './section1';
import * as section2 from './section2';
import * as locators from './locators';

import { isDisplayedOf } from '../../maps factory/element'

export const isDisplayed = isDisplayedOf('menu', locators.menu);

export
  { button
  , x
  , section0, section1, section2 };