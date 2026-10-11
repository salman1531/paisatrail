const steps = [
  ['account', 'Create your account and sign in', [
    'Open PaisaTrace and choose Create account. Enter your email, a password of at least 12 characters, and the same password again.',
    'Open the confirmation email once. It returns you to the public PaisaTrace website. Check the account shown, type your own email and continue only if you requested the link.',
    'On later visits, choose Sign in and use that email and password. On phones, a short benefit statement and demo action appear above the sign-in fields. Signing out keeps your account and records.',
    'Already confirmed that address? Do not create another account. Use Sign in. If you forgot your password, choose Set or reset password, open the latest email and save a new password.'
  ], 'The demo is for practice: its sample records stay in that browser and are not transferred into your account. Never share a confirmation or recovery URL; it can contain session credentials.'],
  ['preferences', 'Choose your currency and timezone', [
    'Open Settings. Choose Default entry currency and Timezone, then Save settings.',
    'Choose these before entering your own data. The timezone sets today’s default date; entries keep the dates you selected.',
    'Choose Reporting currency on Overview or Money Log to change the report without changing the entry default. An individual entry can use another supported currency through Add entry.'
  ], 'Currencies are kept separate and are never converted. Changing the entry default previews the effect before saving. Existing entries, monthly goals and earlier default planning/emergency amounts retain their original currencies. No plans are reset.'],
  ['income', 'Plan income and record receipts', [
    'Open Income. Received shows actual income recorded in the selected date range and currency. Expected is your planned income; Still expected is the outstanding remainder.',
    'Choose Record income for money already received. Sources and expectations are optional; unexpected and unassigned income are valid.',
    'Choose Add source to name an employer, client, business or property. Select its category, regular or variable pattern and default currency. You can optionally add an expectation for the current period. A source is who pays you; Freelance is a category, while Client A is a source.',
    'Choose Add expected payment for anticipated income. When it arrives, choose Record receipt. Review the prefilled category, source, currency, date and amount, then Save entry. For a partial receipt, enter only the amount that arrived.',
    'A PKR 30,000 expectation with a PKR 20,000 receipt leaves PKR 10,000 still expected. Edit expectation to revise its total, or Cancel remainder. Edit or delete the linked Money Log entry to correct a receipt.'
  ], 'Expected payments never increase actual income or available money. Each receipt is one transaction, linked to its expectation. Received uses the receipt date; the expectation remains in its original planning period.'],
  ['expenses', 'Add everyday expenses', [
    'Choose Add expense beneath Budget remaining on Overview. Money Log also has Quick expense entry. Enter the amount and choose what you spent on, such as Home → Rent or Transport → Petrol. The picker groups choices by parent, offers recent selections first, and has Search for finding a name.',
    'For a choice that is missing, select Other — enter a custom name and enter a spending name. It becomes a reusable expense category.',
    'Check the amount in words and its currency, then choose Save expense in quick capture or Save entry in the popup. Today is already selected.',
    'In quick capture, use Date, payment type & note for an older expense or extra detail. The popup includes date and currency fields. Open More details for payment type and note; Save entry stays in the footer while the form scrolls. Choose an optional payment type: Cash, Credit Card, Debit Card, Bank Account or Others. This is a label, not a linked financial account. Older entries show Not specified.'
  ], 'Selecting a subcategory saves it under its parent automatically. You can record multiple separate expenses on the same day.'],
  ['bulk-expenses', 'Save several expenses together', [
    'Choose Add multiple expenses in Money Log. Each expense has its own category, amount, date, optional payment type and note.',
    'Choose Add another expense to add a row. The last category is offered again within this session; change it when needed. Use Remove to discard an unsaved row.',
    'Check the running total in the selected currency, then Save all expenses. All rows save together. A validation error highlights the affected fields without losing your entries.',
    'If a save fails, keep this session open and retry. The same entry IDs are reused to prevent duplicate submission. Cancel asks before discarding a filled draft.',
    'For one expense at a time, use Add expense or Add entry. Save & add another saves that entry and keeps the popup open with its category and date.'
  ], 'A session supports up to 50 expenses in one currency. Identical expenses are valid separate purchases. If dates span months, the report opens the latest saved month; every record keeps its own date.'],
  ['contributions', 'Track savings and investments', [
    'Choose Add savings or Add investment in Money Log, or choose the corresponding type in Add entry.',
    'Select a category or subcategory, or choose Other — enter a custom name to save a reusable category. Enter a positive amount and choose Contribution for money put away.',
    'For money taken back out, choose Withdrawal and enter a positive amount. The app subtracts it from that type’s net contributions.'
  ], 'These totals measure money contributed minus withdrawals, not your bank balance or market returns. Record each movement once; moving money into savings is not also an expense.'],
  ['categories', 'Make categories fit your life', [
    'Open Categories. Search by category or subcategory name, filter by type and Active/Archived status, and choose the reporting period and currency.',
    'Choose Other — enter a custom name in an entry form to create a reusable category without leaving the form. Or use Add category for a main group. Expand Subcategories & details, then use Add subcategory to [category name] for detail within expenses, savings or investments—for example Home → Rent and Bills.',
    'Use the edit pencil to rename a choice or restore an archived choice. Archive hides a linked choice while its existing entries stay intact. Delete appears only for unused choices.'
  ], 'Main totals include their subcategories once. Expense limits are set in Budgets. Named savings and investment contribution outcomes are set in Goals. Their actual amounts include subcategories once; archiving a linked choice keeps its history intact.'],
  ['budgets', 'Create a spending budget', [
    'Open Budgets. Check the selected period dates and reporting currency. Choose Create budget or Edit budget.',
    'Start from scratch, Copy previous plan, or Use previous spending. These fill editable drafts and do not save automatically.',
    'Set an optional overall allowance and category limits. Choose a parent to include all its children, or allocate individual children. A parent and its children cannot both receive limits in the same plan.',
    'Blank overall allowance uses the sum of category limits, or No target set when no limits exist. Zero is an intentional zero allowance. Category limits are included inside an explicit overall allowance.',
    'The percentage helper previews a share of Received income or Expected income, labelled explicitly. Apply it to the draft, then Save budget. Later income changes do not alter your saved amount.',
    'Optional rollover adds positive unused allowance from the immediately previous saved period in the same currency. Overspending does not roll forward. Matching category limits can carry their own unused amount.'
  ], 'Budget remaining is a spending allowance, not a bank balance. Saved earlier monthly expense limits move here; original planning records remain available in your all-records export.'],
  ['goals', 'Save toward a named outcome', [
    'Open Goals and choose Add goal. Name your outcome, such as Emergency fund, Laptop or Holiday, and set a target, currency, optional starting savings and deadline.',
    'Set an optional contribution plan for the selected period. Blank means No target set; zero is intentional. Earlier savings or investment targets can fill this amount only when you choose Review earlier plan.',
    'Choose Add contribution when you put money aside. Withdraw records money taken back out. Both create one savings or investment movement; neither creates income or expenses.',
    'Use Link existing entry to assign an unlinked savings or investment record to the goal without adding another transaction. Do not link money already counted in starting savings.',
    'Progress is starting savings plus linked contributions minus withdrawals across all periods. Edit the target or deadline, Pause or Resume the goal, and Complete when its target is reached.'
  ], 'A deadline provides an approximate per-period contribution guide, without assumed interest or returns. Investment goals track contributions, not market value. Goal progress never resets at the month boundary.'],
  ['cycles', 'Choose calendar months or a budget cycle', [
    'Overview, Money Log, Income, Budgets, Goals and Reports share the period selector. Use Previous period, Next period, Go to date or Current period. The actual start and end dates are always shown.',
    'In Settings, choose a monthly cycle start day and a future starting boundary of your existing cycle. Preview and confirm the change. A day-25 cycle runs from the 25th to the 24th.',
    'The first period after a change may be shorter while boundaries align. Days 29–31 clamp to the last available day in shorter months.',
    'The change starts only at the future boundary. Past plans and transaction dates stay unchanged. Choose Calendar month in View for ordinary calendar reporting; the same transactions can appear in either date-based view.'
  ], 'A plan belongs to its exact saved dates and currency. Future plans for older date ranges remain in your exported history; create or copy a plan for the new range. Comparisons use the same selected cycle.'],
  ['overview', 'Read your overview and reports', [
    'Budget remaining is the main figure. Read spending against the saved allowance, its progress bar and any rollover, then choose Add expense. Missing plans show Budget not set; overspending remains visible.',
    'Open Income, savings & investments for supporting recorded totals. Forecast still expected is labelled separately and never enters actual arithmetic. Named goal progress shows lifetime amounts.',
    'See where your money goes switches between expenses and actual income. The inner ring shows categories and the outer ring their subcategories. On Overview, select a slice to open its Money Log records.',
    'Open Reports for recorded totals and comparison with the previous matching budget period. Calendar, year and custom report options show their own explicit date scope. Forecasts are excluded.',
    'Money Log has search, entry filters, corrections and Excel export. Search another date range supports calendar months, full years, all history and custom dates without changing Overview’s planning context.'
  ], 'Income left after allocations = income received minus spending and net savings/investment contributions. It is a record-based figure, not a bank balance. Currencies are never combined or converted. Detailed Money Log filters affect only its list and export.'],
  ['entries', 'Find, correct and export records', [
    'Open Money Log — everything you earn, spend, and set aside. Choose the period, search by note, category, subcategory or type, and select a type, category, payment type or entry currency if needed. Chart drill-down also filters the chosen subcategory.',
    'Choose Clear entry filters to remove search, type, category, subcategory, payment-type and entry-currency filters. Choose another period if the record is still missing.',
    'On a phone, open the three-dot Actions button and choose Edit or Delete. On desktop, use the edit pencil. Save entry applies corrections. Deleting shows the exact amount, currency, category, date and note before you confirm Delete entry; it removes the record from your reports.',
    'Choose Export Excel to download the selected period and entry filters. The workbook includes entries and summaries with currencies kept separate.'
  ], 'Export important records before deleting them. Settings → Account & support offers Export all records, Contact support and Request account deletion. Deletion requests and their status are handled by email after ownership verification; signing out is not account deletion.'],
];

const questions = [
  ['I did not receive a signup email. What next?', 'If you already confirmed the address, use Sign in instead. For a new or unverified account, check spam and that the email is correct, wait at least a minute, and try again. If it still fails, contact support. Do not share passwords or email-link tokens.'],
  ['Why does a budget not show in Overview?', 'Choose its exact saved period dates and reporting currency. Named goals track lifetime progress separately. A plan does not create actual transactions.'],
  ['Where is my saved entry?', 'Check the entry date, reporting year/month, category/entry currency filters and search. Clear entry filters. Another currency may appear in the entry list without being included in the display-currency totals.'],
  ['Will rent or subscriptions be added automatically?', 'No. Entries are manual. Record recurring payments when they occur. Automatic recurring entries, bill reminders and debt tracking are not currently available.'],
  ['Can I use another phone or computer?', 'Yes: sign in to the same account. The demo stays in its own browser; real account records are stored online. If a save reports an error, retry after checking your connection rather than assuming it succeeded.']
];

const screenshots = {'bulk-expenses':['bulk-expenses-mobile.jpg','Review several expenses and their combined total before saving','phone'],expenses:['expense-mobile.jpg','Record an expense with an amount, category and date','phone'],goals:['goals-mobile.jpg','Track a named outcome with lifetime progress and a period contribution plan','phone'],overview:['overview.jpg','Budget remaining leads your overview with spending against its plan','wide'],entries:['entries.jpg','Use Money Log to find and review the selected month','wide']};

function guideScreenshot(id,escape,versions) {
 const shot=screenshots[id];if(!shot)return '';
 const [file,caption,layout]=shot;const url=name=>'/guide-images/'+name+'?v='+versions[name];
 const mobile=layout==='wide'?id+'-mobile.jpg':null;
 return `<figure class="guide-shot ${layout}"><a href="${url(file)}" target="_blank" rel="noopener noreferrer"><picture>${mobile?`<source media="(max-width:600px)" srcset="${url(mobile)}" width="390" height="844">`:''}<img style="width:100%;max-width:100%;height:auto" src="${url(file)}" alt="${escape(caption)} — synthetic demo" loading="lazy" decoding="async" width="${layout==='phone'?390:1280}" height="${layout==='phone'?844:900}"></picture></a><figcaption>${escape(caption)}. Demo example · tap to enlarge.</figcaption></figure>`;
}

export function userGuide({ origin, draft, nav, contact, escape, stylesheet, imageVersions }) {
  const md = '# PaisaTrace user guide\n\nStart small: record your income and expenses. Goals and custom categories can come later.\n\n' + steps.map(([, title, actions, note], i) => `## ${i + 1}. ${title}\n\n${actions.map((a, n) => `${n + 1}. ${a}`).join('\n')}\n\n${note}`).join('\n\n') + '\n\n## Troubleshooting\n\n' + questions.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n') + `\n\n${contact}\n`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PaisaTrace user guide — From signup to your monthly review</title><meta name="description" content="Learn how to record income and expenses, track savings, set monthly goals, understand your dashboard and export records in PaisaTrace."><meta name="robots" content="${draft ? 'noindex, nofollow' : 'index, follow'}">${draft ? '' : `<link rel="canonical" href="${origin}/guide.html">`}<link rel="stylesheet" href="${stylesheet}"><link rel="icon" href="/favicon.svg"><link rel="alternate" type="text/markdown" href="/guide.md"></head><body class="guide-page"><main>${nav}<div class="guide-hero"><p class="brand-name">PAISATRACE · USER GUIDE</p><h1>Your first entry.<br>Your next month.</h1><p>Start small: record your income and expenses. Goals and custom categories can come later.</p><a class="start" href="/">Open PaisaTrace</a><p class="guide-path">01 · Record money &nbsp; / &nbsp; 02 · Plan your month &nbsp; / &nbsp; 03 · Review progress</p></div><p class="small guide-demo-note">Screenshots show synthetic demo examples, never a real user’s records. Amounts and layout may vary with your currency and device.</p><nav class="guide-contents" aria-label="Guide contents">${steps.map(([id, title], i) => `<a href="#${id}">${i + 1}. ${escape(title)}</a>`).join('')}<a href="#troubleshooting">Troubleshooting</a></nav>${steps.map(([id, title, actions, note], i) => `<section id="${id}" class="guide-step"><p class="step-number">STEP ${i + 1}</p><h2>${escape(title)}</h2><ol>${actions.map(a => `<li>${escape(a)}</li>`).join('')}</ol><p class="guide-note">${escape(note)}</p>${guideScreenshot(id,escape,imageVersions)}<a href="#top">Back to top ↑</a></section>`).join('')}<section id="troubleshooting"><h2>Troubleshooting</h2>${questions.map(([q, a]) => `<details><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`).join('')}<p>${escape(contact)}</p></section><footer>${nav}<p>Powered by <a href="https://www.hirubix.com/" target="_blank" rel="noopener noreferrer">Rubix Labs</a></p></footer></main></body></html>`;
  return { html: html.replace('<main>', '<main id="top">'), md };
}
