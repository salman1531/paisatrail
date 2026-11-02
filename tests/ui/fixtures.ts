import {newDemo} from '../../src/demo';
import type {Currency} from '../../src/types';
// Fixed alongside the acceptance scenarios; unaffected by the CI runner's month.
export function demoFixture(currency:Currency='PKR',options:{legacyAccounts?:boolean}={}){return newDemo(currency,{...options,asOf:'2026-10-31'});}
