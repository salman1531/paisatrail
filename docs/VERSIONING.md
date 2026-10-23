# Current release: 2.1.0

Shared Expenses is the operator-authorized 23 October 2026 release. The immediate frontend rollback baseline is **2.0.0**, tag `v2.0.0`, production commit `402f6f02e8493c73e4a3108bf377913c2f912621`, immutable Vercel deployment `AzyueTu2PLBVu9odbkkdFwofU61F`. Its complete verified bundle and manifest remain in outputs/backups/2026-10-22 in the parent workspace. Preserve them. Shared Expenses uses additive migration018; a frontend rollback retains shared records and access rules. Read SHARED_EXPENSES_RELEASE.md.

The older version history below remains unchanged as a historical record.

# Release versions and rollback

Rollback production baseline: **1.0.0**, commit `79281a64571987ec9fd38a89d5f4038868f77105`, tag `v1.0.0`.

The current release is **2.0.0**, prepared on `codex/forest-finance-rebuild` for the user-authorized production deployment. See SIMPLE_RECORDING_RELEASE.md for the account-free flow and approved backend setup. The earlier Cloud & Teal experiment was stopped and is preserved independently on `codex/cloud-teal-accessibility`; it is not part of this rebuild.

## Maintaining versions

Use package.json as the source of truth. Match both root version fields in package-lock.json and add a CHANGELOG.md entry. `npm run release:check` verifies these before building. Increment preview numbers for review builds; promote to 2.0.0 only after acceptance. Use patch releases for later corrections. Never move or reuse a published version tag.

## Rollback

Keep the previous Vercel deployment `GcnU17X3qid9z5vkEes5XaZR3k86` available. A frontend rollback can restore that immutable deployment or publish a revert based on the tagged production baseline. Do not reset shared Git history, delete financial records, or undo additive database migrations to change the visual version.

The complete verified production Git bundle is in the parent workspace at `outputs/backups/2026-10-21/paisatrace-before-forest-citrus.bundle`. The historic filename predates the change in design direction; its production commit is correct. The unrelated index.html edit is preserved separately as `unrelated-index-edit.patch` and excluded from release commits.

Any new migration must preserve compatibility with 1.0.0 while a rollback remains possible. Verify old-client writes and keep new fields nullable or defaulted; never backfill guessed account assignments.

## Preserved preview versions

- **2.0.0-preview.1**: five primary destinations including Reports, commit `7eba1c78f9f5b51715e27e22268a2f413b6374c8`, immutable tag `v2.0.0-preview.1`; complete verified bundle in `outputs/backups/2026-10-22/paisatrace-v2.0.0-preview.1.bundle` in the parent workspace.
- **2.0.0-preview.2**: four primary destinations, consolidated Overview insights and legacy Reports redirects, tag `v2.0.0-preview.2`; separate complete bundle in the same backup directory. Read OVERVIEW_CONSOLIDATION_RELEASE.md for acceptance evidence. Neither preview has replaced production.

To review an earlier version, create an isolated checkout from its tag or bundle. Keep current local work intact. Tags and bundles are immutable release records; do not overwrite preview 1's manifest when recording preview 2.

## Production release 2.0.0

Publish a numbered 2.0.0 tag without moving either preview tag. Save the complete release bundle and deployment manifest separately from previous manifests. Migration017 was approved and applied to production on 22 October; wallet features remain disabled. The frontend can roll back without dropping this additive schema. Immutable build/commit IDs and live checks are recorded in the parent workspace release manifest after deployment.
