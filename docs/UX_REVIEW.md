# PaisaTrace usability review — 6 October 2026

Reviewed the sign-in/signup/recovery interface, Overview, entry forms, Daily entries, Categories/subcategories, Goals, Settings, exports and public information. Evidence combines current source, direct browser demo walkthroughs and existing unit/database regression coverage. This is a product usability review, not a legal or security certification or an exhaustive production-account test. No private financial records were changed.

| Finding | Change |
| --- | --- |
| Income/savings/investment shortcut opened an expense form | Separate shortcuts preselect their intended entry type and matching choices. |
| New entries could disappear behind the selected month/category/search | A successful Add/Edit save selects the entry's reporting month and clears entry filters. |
| Headline totals changed with category filters while targets remained whole-month | Summary cards now use all period categories, matching overall goals and remaining income; list/chart/export filter scope is explained. |
| No easy recovery from an empty filtered list | Clear entry filters appears when search/category filtering is active. |
| Main goal form and planning examples compete for attention | Planning examples/custom split stay in an optional disclosure. Manual monthly goals remain the primary path. |
| Quick expense capture was below all summary cards on phones | Quick capture now precedes the summary cards on Overview. |
| Technical sitemap/llms links crowd the everyday footer | Replace them with User guide. Discovery files remain publicly served and linked through robots/sitemap. Keep license and policy links. |
| Signup response implied every signup attempt sends email | Explain that an already verified address should sign in, without exposing whether an arbitrary address has an account. |
| No end-to-end help | Public, responsive guide with 11 ordered sections, jump links, amount/percentage examples, reporting definitions and troubleshooting; accessible before login and from every workspace header. Help opens separately to preserve current form edits. |

## Keep the core small

Income, daily expenses, monthly goals, category limits, search, charts and Excel exports serve the core manual tracker. Subcategories, investment tracking, emergency targets and planning examples are useful optional tools; keep them available without requiring them for first use. Yearly reports are useful history and are separate from monthly-only goals. Do not add debt tracking, bank connections, trading, tax calculations or recurring rules just to fill a feature checklist.

## Recommended next improvements

1. Protect unsaved Goals edits when leaving the Goals tab or refreshing, beyond the existing protection when switching months. This requires coordination between the editor and app navigation; it is not implemented by this review.
2. Compact Categories with expandable parent groups/archived-choice filtering once users have many choices. Keep historical records and restore actions available.
3. Add a focused recurring-entry workflow only after user feedback shows repeated manual rent/subscription entry is a problem. Bills/reminders would then need explicit scheduling, timezone and notification preferences.
4. Consider named savings goals after validating demand; the current savings target is an overall monthly target, plus a separate emergency cushion.
5. Verify password recovery end to end with a real account and new password entered by the user. Signup was confirmed working by the user on 6 October. Automated fixture tests do not replace email delivery/recovery checks.

## Verification scope

TypeScript, production build and 43 unit/database tests pass. Direct browser checks verify matching entry-type shortcuts, unchanged summary cards under category filtering, filter clearing, optional planning visibility and guide anchor navigation. Guide and dashboard checked at 390px without horizontal overflow. Standalone Playwright cannot launch installed Chrome in this environment (SIGABRT before execution); added UI regressions are preserved for an environment where it can run. Existing export and account-isolation tests cover calculation/storage contracts, not a full real-account browser flow.


## Product-expert follow-up — 6 October 2026

Implemented the first usability release: Overview leads with remaining income, spending vs budget and savings progress; expense entry is collapsed below it with a direct Add expense action. Daily entries starts with search/filter/list and has an optional budget disclosure below. Report period/currency is independent of list category/search; every scope is labelled. Responsive stacked transaction rows extend through tablet/intermediate widths, with explicit Actions/Edit/Delete controls.

Default entry currency is distinct from reporting currency. Migration009 preserves original default-plan/emergency currency and monthly goals, with an effect preview before preference changes; no conversion/reset. New accounts and reset demo use Food → Groceries/Dining/Coffee and one starter hierarchy. Existing custom/legacy categories remain untouched; owners can rename/archive through Categories. This avoids relabelling historical spending without their decision.

Demo scenarios have four months of fictional activity for each supported currency. Signup copy describes the practical outcome and previews the dashboard. Settings includes all-record export and email support/deletion request links; status remains email-based, not an in-app request tracker. Recurring templates, reminders, named savings goals, debt tracking and a dedicated monthly review remain roadmap items requiring prioritization.

## Latest product team review — 7 October follow-up

Addressed all three reproduced state bugs: retain Goals drafts while switching tabs, preserve month across currency changes, and reset/guard inaccessible routes across account/demo transitions. Goals uses independent planning context; saving synchronizes reports explicitly. Sign-out and reload protect unsaved work, including the emergency draft.

Added independent entry currency filtering/export scope, exact deletion details and clear recorded-income/budget labels with pending contribution detail. A parent/subcategory breakdown makes existing generic Expenses accounts more useful without modifying history. Full category mapping with a preview and subcategory spending limits are not included. Keep optional recurring templates and a decision-focused monthly review for a separately prioritized release.

59 calculation/export/database tests pass; direct UI checks cover the new flows and responsive widths. The local admin fixture verifies state transitions only. Browser download capture and standalone Chrome remain tooling limitations. Real-account backend writes/cross-device sync and user-completed recovery remain necessary before claiming complete production verification.

The operator selected **Money Log** for desktop/mobile navigation, page title and guide. Subtitle: “Everything you earn, spend, and set aside.” UI selectors and current public copy use this name; internal entries storage/routes stay the same.
