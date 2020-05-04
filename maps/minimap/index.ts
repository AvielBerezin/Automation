import buttonOf from '../../maps factory/button';
import * as locators from './locators';


const { click, isDisplayed } = buttonOf('minimap', locators.minimap);

export { click, isDisplayed };