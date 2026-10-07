const steps = [
  ['account', 'Create your account and sign in', [
    'Open PaisaTrace and choose Create account. Enter your email, a password of at least 12 characters, and the same password again.',
    'Open the confirmation email once. It returns you to the public PaisaTrace website. Check the account shown, type your own email and continue only if you requested the link.',
    'On later visits, choose Sign in and use that email and password. Signing out keeps your account and records.',
    'Already confirmed that address? Do not create another account. Use Sign in. If you forgot your password, choose Set or reset password, open the latest email and save a new password.'
  ], 'The demo is for practice: its sample records stay in that browser and are not transferred into your account. Never share a confirmation or recovery URL; it can contain session credentials.'],
  ['preferences', 'Choose your currency and timezone', [
    'Open Settings. Choose Default entry currency and Timezone, then Save settings.',
    'Choose these before entering your own data. The timezone sets today’s default date; entries keep the dates you selected.',
    'Choose Reporting currency on Overview or Daily entries to change the report without changing the entry default. An individual entry can use another supported currency through Add entry.'
  ], 'Currencies are kept separate and are never converted. Changing the entry default previews the effect before saving. Existing entries, monthly goals and earlier default planning/emergency amounts retain their original currencies. No plans are reset.'],
  ['income', 'Record the money you receive', [
    'On Overview, choose Add income. The form opens with Income selected.',
    'Enter the amount, currency, category and date. Add a note such as Salary or Freelance payment if helpful.',
    'Choose Save entry. The reporting month switches to the entry’s date so you can see the result.'
  ], 'An earnings target is a plan, not a transaction. To include earnings in your overview, record the actual income you received.'],
  ['expenses', 'Add everyday expenses', [
    'Use the compact Add an expense panel on Overview, or the Add expense button. Enter the amount and choose what you spent on, such as Rent, Bills or Petrol.',
    'For a choice that is missing, select Other — enter a custom name and enter a spending name. It becomes a reusable expense category.',
    'Check the amount in words and its currency, then choose Save expense in quick capture or Save entry in the popup. Today is already selected.',
    'In quick capture, use Change date or add a note for an older expense or extra detail. The popup includes date, note and currency fields.'
  ], 'Selecting a subcategory saves it under its parent automatically. You can record multiple separate expenses on the same day.'],
  ['contributions', 'Track savings and investments', [
    'Choose Add savings or Add investment on Overview, or choose the corresponding type in Add entry.',
    'Select a category or subcategory, or choose Other — enter a custom name to save a reusable category. Enter a positive amount and choose Contribution for money put away.',
    'For money taken back out, choose Withdrawal and enter a positive amount. The app subtracts it from that type’s net contributions.'
  ], 'These totals measure money contributed minus withdrawals, not your bank balance or market returns. Record each movement once; moving money into savings is not also an expense.'],
  ['categories', 'Make categories fit your life', [
    'Open Categories. Keep the starter choices that are useful to you.',
    'Choose Other — enter a custom name in an entry form to create a reusable category without leaving the form. Or use Add category for a main group. Use Add subcategory to [category name] for detail within expenses, savings or investments—for example Home → Rent and Bills.',
    'Use the edit pencil to rename a choice or restore an archived choice. Removing a used choice archives it so your history remains.'
  ], 'Main totals include their subcategories once. Expense-category budgets are set on the parent category, not individually on each subcategory.'],
  ['goals', 'Set goals for one month', [
    'Open Goals, choose the Goal currency and then the Goal month or one of the month buttons. Saved goals are marked. Using defaults means the earlier plan already applies. Choose Use defaults to save it for that month, or Customize to change it.',
    'Enter the Earnings target, Expense limit, Savings target and Investment target. Use Amounts, or choose Percentages of earnings for the last three.',
    'For example, with an earnings target of 100,000 pkr, a 10% savings target becomes 10,000 pkr. Saving stores that calculated amount for this month.',
    'Choose Save monthly goals. Blank overall values save as zero. Other months are independent; saving also selects that month in your reports.'
  ], 'Goals are optional. Changing your actual income later does not automatically recalculate a saved percentage goal. Edit the month’s targets when your plan changes.'],
  ['planning', 'Use optional planning help', [
    'Inside Goals, open Need help splitting your earnings? if you want a starting point.',
    'Enter a positive earnings target, choose a Planning example or Create my own split, then review its amounts. A custom split can total up to 100%.',
    'Choose Save plan for [month], review the confirmation, then Confirm and save goals. Cancel leaves your saved goals unchanged.',
    'Open Category spending limits (optional) for parent-category budgets. These are included within the overall expense limit, not extra allowances.'
  ], 'Use either your own monthly amounts or a planning example. Examples are editable starting points, not a recommendation tailored to your finances.'],
  ['emergency', 'Set an optional emergency cushion', [
    'In Goals, open Emergency fund (optional), enter the long-term target and choose Save emergency target.',
    'In Categories, mark the relevant savings category or subcategory as an emergency fund.',
    'Record savings contributions there. Emergency progress includes those contributions across months, minus withdrawals.'
  ], 'Emergency savings are already included in total savings. The emergency target is long-term and is saved separately from the month’s targets.'],
  ['overview', 'Read your overview and reports', [
    'Choose the year and month on Overview. Full year and All years let you review a longer period; monthly goal comparisons need a single month.',
    'Read Remaining income, Spending against budget and Savings progress first. Recorded income and net investment contributions appear alongside them. All overview totals cover the selected period, all categories and Reporting currency.',
    'Remaining income is recorded income minus expenses and net savings/investment contributions. Above recorded income shows the excess as a positive amount. Income not recorded means you need to add actual income.',
    'Use Income & spending to explore months and Where your spending goes to see categories and subcategories. Expand Monthly goals & category limits or Compare with the previous month for more detail.'
  ], 'Remaining income is not a reconciled bank balance. Search and category filters affect only the entry list and its Excel export. They never change the overview cards or charts. Each section shows its scope. The entry list includes all currencies.'],
  ['entries', 'Find, correct and export records', [
    'Open Daily entries (Entries in the mobile navigation). Choose the period, search by note, category, subcategory or type, and select a category if needed.',
    'Choose Clear entry filters to remove search/category filters. Choose another period if the record is still missing.',
    'On a phone, open the three-dot Actions button and choose Edit or Delete. On desktop, use the edit pencil. Save entry applies corrections. Deleting asks for confirmation and removes the record from your reports.',
    'Choose Export Excel to download the selected period and entry filters. The workbook includes entries and summaries with currencies kept separate.'
  ], 'Export important records before deleting them. Settings → Account & support offers Export all records, Contact support and Request account deletion. Deletion requests and their status are handled by email after ownership verification; signing out is not account deletion.'],
];

const questions = [
  ['I did not receive a signup email. What next?', 'If you already confirmed the address, use Sign in instead. For a new or unverified account, check spam and that the email is correct, wait at least a minute, and try again. If it still fails, contact support. Do not share passwords or email-link tokens.'],
  ['Why does a goal not show in Overview?', 'Select the same month and display currency you used when saving it. A goal does not add income, expenses or contributions to your recorded totals.'],
  ['Where is my saved entry?', 'Check the entry date, reporting year/month, category filter and search. Clear entry filters. Another currency may appear in the entry list without being included in the display-currency totals.'],
  ['Will rent or subscriptions be added automatically?', 'No. Entries are manual. Record recurring payments when they occur. Automatic recurring entries, bill reminders, named savings goals and debt tracking are not currently available.'],
  ['Can I use another phone or computer?', 'Yes: sign in to the same account. The demo stays in its own browser; real account records are stored online. If a save reports an error, retry after checking your connection rather than assuming it succeeded.']
];

const screenshots = {expenses:['expense-mobile.jpg','Add an expense with a custom spending name','phone'],goals:['goals-mobile.jpg','Enter your monthly earnings, spending and contribution targets','phone'],overview:['overview.jpg','Your overview brings actual income and spending together','wide'],entries:['entries.jpg','Find and review your entries for the selected month','wide']};

export function userGuide({ origin, draft, nav, contact, escape }) {
  const md = '# PaisaTrace user guide\n\nStart small: record your income and expenses. Goals and custom categories can come later.\n\n' + steps.map(([, title, actions, note], i) => `## ${i + 1}. ${title}\n\n${actions.map((a, n) => `${n + 1}. ${a}`).join('\n')}\n\n${note}`).join('\n\n') + '\n\n## Troubleshooting\n\n' + questions.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n') + `\n\n${contact}\n`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PaisaTrace user guide — From signup to your monthly review</title><meta name="description" content="Learn how to record income and expenses, track savings, set monthly goals, understand your dashboard and export records in PaisaTrace."><meta name="robots" content="${draft ? 'noindex, nofollow' : 'index, follow'}">${draft ? '' : `<link rel="canonical" href="${origin}/guide.html">`}<link rel="stylesheet" href="/site.css"><link rel="icon" href="/favicon.svg"><link rel="alternate" type="text/markdown" href="/guide.md"></head><body class="guide-page"><main>${nav}<div class="guide-hero"><p class="brand-name">PAISATRACE · USER GUIDE</p><h1>Your first entry.<br>Your next month.</h1><p>Start small: record your income and expenses. Goals and custom categories can come later.</p><a class="start" href="/">Open PaisaTrace</a><p class="guide-path">01 · Record money &nbsp; / &nbsp; 02 · Plan your month &nbsp; / &nbsp; 03 · Review progress</p></div><p class="small guide-demo-note">Screenshots show synthetic demo examples, never a real user’s records. Amounts and layout may vary with your currency and device.</p><nav class="guide-contents" aria-label="Guide contents">${steps.map(([id, title], i) => `<a href="#${id}">${i + 1}. ${escape(title)}</a>`).join('')}<a href="#troubleshooting">Troubleshooting</a></nav>${steps.map(([id, title, actions, note], i) => `<section id="${id}" class="guide-step"><p class="step-number">STEP ${i + 1}</p><h2>${escape(title)}</h2><ol>${actions.map(a => `<li>${escape(a)}</li>`).join('')}</ol><p class="guide-note">${escape(note)}</p>${screenshots[id] ? `<figure class="guide-shot ${screenshots[id][2]}"><a href="/guide-images/${screenshots[id][0]}" target="_blank" rel="noopener noreferrer"><img src="/guide-images/${screenshots[id][0]}" alt="${escape(screenshots[id][1])} — synthetic demo" loading="lazy" decoding="async" width="${screenshots[id][2]==='phone'?390:1280}" height="${id==='entries'?900:screenshots[id][2]==='phone'?844:720}"></a><figcaption>${escape(screenshots[id][1])}. Demo example · tap to enlarge.</figcaption></figure>` : ''}<a href="#top">Back to top ↑</a></section>`).join('')}<section id="troubleshooting"><h2>Troubleshooting</h2>${questions.map(([q, a]) => `<details><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`).join('')}<p>${escape(contact)}</p></section><footer>${nav}<p>Powered by <a href="https://www.hirubix.com/" target="_blank" rel="noopener noreferrer">Rubix Labs</a></p></footer></main></body></html>`;
  return { html: html.replace('<main>', '<main id="top">'), md };
}
