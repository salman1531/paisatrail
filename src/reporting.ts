import type {Currency, Ledger, Profile} from './types';

// Legacy defaults are amounts in their original currency, never values to convert.
export function reportingLedger(ledger: Ledger, currency: Currency): Ledger {
  const same = currency === (ledger.profile.planning_currency ?? ledger.profile.currency);
  return {...ledger, profile:{...ledger.profile,currency,...(!same ? {income_target:0,spending_target:0,saving_target:0,investment_target:0,emergency_target:0,emergency_contribution:0} : {})}};
}
export function preferenceUpdate(profile: Profile, currency: Currency, timezone: string): Profile {
  return {...profile,currency,timezone,planning_currency:profile.planning_currency ?? profile.currency};
}
