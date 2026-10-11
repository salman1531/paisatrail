# Money Plan release — 11 October 2026

This release implements the supplied Money Plan handoff. Password sign-in remains primary; analytics work stays paused.

## Existing contracts reused

| Responsibility | Existing storage / API | Change |
|---|---|---|
| Actual income, expenses and net contributions | `entries`, `saveEntry` / atomic `saveEntries` | No income prerequisites or caps. Goal attribution is one nullable link, never another movement. |
| Optional forecasts and payer identities | `expected_payments`, `income_sources` | Secondary Upcoming income / Income sources in Income; excluded from allocations. |
| Spending commitment | `spending_budgets`, `budget_allocations`, `replace_spending_budget` | Same exact dates/currency; category base limits cannot exceed an explicit overall base. |
| Lifetime outcome | `named_goals`, `save_named_goal` | Starting savings affect lifetime only. Status does not implicitly clear a plan. |
| Period goal commitment | `goal_contribution_plans`, `save_named_goal` | Sum saved amounts, including paused/completed goals; optional explicit earlier-plan marker prevents duplicate conversion. |
| Period boundaries | `budget_cycles`, `periodForDate` | Existing timezone, clamping and future transition behavior retained. |
| Existing-entry association | Owner-scoped conditional `entries` update | Update the goal link only while unlinked. Safe same-goal retry; a different association requires deliberate Money Log editing. |

`moneyPlanSummary` calculates I − G − S from actual received income, saved goal plans and the effective spending limit. If S is unset, show Income after planned goals = I − G and Spending has not been planned. Posting expenses/contributions changes actual progress, not commitments. Recorded income left separately subtracts actual spending and net contributions. Blank and zero remain distinct.

Migration014 adds a nullable internal earlier-plan marker and validation triggers; it does not change existing entries, plans, statuses, periods or ownership. Deferred database validation evaluates the final spending-plan replacement and also rejects inconsistent direct writes. Older conflicting limits remain intact and are labelled for correction when edited. Existing RLS and RPC access stay unchanged. The migration is rerunnable; earlier migrations are not.

## Acceptance evidence

| Criteria | Evidence |
|---|---|
| AC01 navigation; AC27 compatible links | Connected browser: five destinations, `#budgets` focuses Spending plan, `#goals` focuses Goals; guide anchors preserved. |
| AC02–05 income/no prerequisites/forecast isolation | New-ledger fixtures and private database accounts; actual income inserts without source/expectation; calculation tests exclude forecasts and legacy targets. |
| AC06–09 lifetime versus period, one contribution/link | Worked-example unit checks; connected demo contribution; unchanged plan summary; database FK and atomicity checks. |
| AC10 one goal per entry | Association-only conditional write plus owner/kind/currency checks. Existing-entry edit is the explicit reassignment path. |
| AC11–14 starting, met/above, withdrawal, blank/zero | Calculation and database tests; connected demo met-plan blank suggestion and withdrawal reopening remaining contribution. |
| AC15 category/overall limits | Client exact-difference error and retained draft; private database RPC/direct-write rejection and rollback. |
| AC16–19 income changes, over-allocation, overspending, absent limit | Unit worked example and zero/no-income cases; connected browser currency with no plan and existing overspent category. |
| AC20–21 period/currency/status | Connected browser period switch retains lifetime and has no copied plan; currency isolation; pause keeps plan by default. Database explicit clear preserves older plans. |
| AC22–24 rollover, copy draft, corrections | Existing and new accounting tests; draft helpers create no entries; existing server goal-negative checks protect corrections. |
| AC25 retry/duplicate prevention | Stable IDs and existing lost-response batch tests; goal RPC repeated-save and legacy conversion tests; connected form validation retry retains draft. Network failure UI automation remains pending because Chrome launch fails. |
| AC26 unchanged history/idempotence | Legacy ledger totals/IDs/links tests; migration014 run twice on private fixtures retains historical rows, including conflicting old plans. |
| AC28 responsive/keyboard | Connected browser: 42 page/width checks at 320,390,660,768,1024,1440; no overflow. 320×568 modal footer, 16px fields, dirty close/keep/discard and restored scrolling checked. Physical phone keyboard and screen reader testing remain unverified. |
| AC29 future cycles | Existing cycle database/unit tests and connected demo’s preserved November transition. |
| AC30 worked example | Exact sequential assertions in `tests/moneyPlan.test.ts`, including unchanged unallocated figure after posting activity. |

123 unit/database tests pass; TypeScript and production build pass. Automated Chrome UI suite stops before assertions with SIGABRT at browser launch; connected browser checks provide direct UI evidence, not a passing automated UI suite. New and legacy accounts are isolated fixtures, not newly registered production accounts. Public guide screenshots use a clean synthetic demo origin.

Production migration014 completed successfully; metadata verification checks the marker, three validation triggers, existing RLS and authenticated-only goal RPC access. Frontend deployment verification is recorded in the release handoff after publication.
