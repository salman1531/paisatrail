# Layout follow-up — 17 October 2026

Addresses the second UI review following the scan-clarity release:

- CategoryPicker is one full-width input and chevron control. A bounded, scrolling popover overlays the form without changing dialog height, date position or underlying form scroll. Native Popover API places it above the modal's scrolling/clipping layers; feature detection retains fixed-position placement on older browsers. Placement respects viewport, modal header and save-footer bounds. Keyboard arrows, Home/End, Enter and Escape work; scrolling a choice affects the list only. The shared picker also fixes multiple-expense entry.
- Reports uses four 78–82px cards in one desktop row and two columns on phones, allowing analysis into the initial viewport.
- Every workspace page uses the same compact heading/action row. Money Log's secondary actions move beside its list heading. Transaction groups and rows are tighter, category context shares a line, short notes are plain text and only genuinely clipped notes expand. No record text is lost.
- Desktop Overview places goal progress beside the shorter balance card. Phone order remains spending allowance, recorded totals, goal progress. The amount stays prominent; recorded-income and planning calculations are unchanged.
- Category bars use the total as their denominator, with an explicit 0–100% scale. Printed percentages and bar widths agree.
- The positive allowance label is consistently Spending budget left, with About spending budget left and Spending over budget for deficits. Demo controls provide brief help distinguishing sample datasets from currency filtering; reporting/list currency selectors have visible labels and explanatory titles.
- Guide copy/screenshots, the smaller real homepage budget crop and LLM descriptions are refreshed. Existing routes, sitemap, private noindex boundaries, authentication and database rules are unchanged.

Validation: 141 unit/integration tests passed, including the intentional report-status wording update. Connected Chrome checked all seven workspace pages at nine widths (320, 390, 660, 768, 900, 901, 1024, 1100 and 1440px): no horizontal overflow and 44px headers. Money Log showed four complete records at 320px and five at 390px, with an 844px screen. Four desktop report cards share a row. All rendered bar widths matched their percentage labels within rounding.

Native pointer/keyboard picker checks passed at 1440×900, 768×700, 390×844, 390×500 and 320×568: full field/list width, no dialog/date/form-scroll movement, bounded list above the save footer, keyboard search/selection and Escape. A sample PKR1,250 save updated Spending budget left to PKR46,990 and Income left (recorded) to PKR64,990; a long note expanded from a 56px row and collapsed again. Only synthetic demo records were used.

Four Playwright regressions were added. The runner was attempted but Chrome aborted during launch before assertions (the existing local SIGABRT issue); do not report that suite as passed. Connected-browser checks cover the intended interactions. Physical phone keyboards, screen readers and older-browser fallbacks were not verified. The preexisting unrelated index.html edit remains excluded from publication.
