# Financial model and calculations

These are application accounting and planning rules, not financial advice. Preserve user-specified accounting choices and explain any assumptions in the interface.

## Model boundaries

Suggested concepts are User, Account, Category, Transaction, BudgetPeriod, AllocationPlan, SavingsGoal, and InvestmentContribution or Valuation. Adapt names and schema to the project. A transaction has an authenticated owner, date, positive amount, currency, and explicit kind. Represent direction with its kind or a documented signed ledger convention, consistently throughout the system.

Prefer separate linked transfer entries or a transfer record with source and destination accounts. Transfers can change balances and goal funding but do not create income or consumption expenses. Tagging a savings transfer toward a goal must not create an additional debit. Capture opening balances separately from current-period income. Balance reconciliation requires a complete transaction history or an explicit opening balance and date.

Recurring schedules describe expected activity; report them as forecasts until posted. If automatic posting is implemented, use an occurrence key and database uniqueness to prevent duplicates on retry. Import deduplication must not collapse legitimate identical purchases.

## Monthly actuals

Use a half-open period from the first calendar day of the selected month through, excluding, the first day of the next month. Sum posted external income and expenses in that period and currency. Define how refunds and reversals reduce their original totals. Do not delete their accounting meaning when displaying a positive amount.

Net cash flow = income - consumption expenses.

Unallocated planning amount = planned net income - planned spending - planned savings contributions - planned investment contributions.

These are different measures. A positive net cash flow does not mean that the same cash is still available after transfers or investment contributions. Show account cash balances only when supported by opening balances and ledger entries.

For category variance, show budget - actual expense: positive means remaining budget, negative means overspending. Specify whether a budget uses actual income or a manually supplied income estimate. For variable income, permit an editable baseline and identify it as an estimate.

## Allocation planning

For each percentage target, proposed amount = planning income base × percentage / 100. Use net available income as the default base and label it. A value of 0 is valid; missing income is distinct from 0. Percent-of-income metrics with a zero denominator display unavailable rather than infinity.

Reject negative targets and percentages above 100. Validate the sum of allocation percentages is no more than 100. For mixed fixed and percentage targets, validate the resulting amounts against the same income base and show any shortfall. Do not silently rescale a user's plan. If expenses exceed income, show the deficit before displaying funding as achievable.

Any example allocation is an optional editable preset. Do not state that a preset fits every user's circumstances. User needs, liabilities, income stability, dependents, and goals may change suitable targets. Do not recommend securities, tax treatment, or guaranteed returns from these formulas.

## Emergency savings

Essential monthly expenses = sum of the user's designated essential expense baseline. Use an explicitly chosen budget baseline or an average of complete historical months. When using history, expose the window and exclude incomplete months; distinguish no history from a real zero value.

Target = essential monthly expenses × user-selected target months, unless the user enters a fixed target amount.

Gap = max(target - currently allocated emergency savings, 0).

Months to target = ceil(gap / planned monthly emergency contribution), assuming no withdrawals, interest, or contribution changes. If the gap is zero, the goal is achieved. If the gap is positive and the contribution is zero or negative, no completion date can be calculated. Derive a calendar estimate from the next scheduled contribution date and the required number of contributions, not by adding arbitrary 30-day blocks.

Count only money allocated to this goal, net of withdrawals. An account used for several goals must not allocate the same funds twice. Cap the visual progress bar at 100% while still showing any overfunded amount numerically. If the target is zero, avoid dividing by zero and show that no positive target is configured.

## Investments and currencies

Contribution totals measure money contributed. A current valuation measures asset value as of a specified date. Investment gains require net contributions, withdrawals, and a compatible valuation; percentage performance needs a specified method and sufficient timing data. Never relabel account deposits as returns.

Store currency with every relevant account and amount. Do not assume all currencies have two decimal places. When supporting conversion, retain original amounts, quote currency, rate, source, and date; distinguish converted reporting values from posted values. Do not sum incompatible currencies into a single total without this policy.

Round using the chosen currency's precision at documented boundaries. Allocate any rounding remainder explicitly so a displayed plan and stored allocations reconcile to the same total.
