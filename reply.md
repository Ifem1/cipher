# Reply to More Information Request

Thanks for the review. I updated CIPHER to address the requested validator, ID-scoping, deadline/appeal, and refund-path issues.

## Changes Made

- Validators now independently verify every payout-driving terminal verdict against bounded, authenticated source URLs.
- Resolution reports now include source URLs, evidence summaries, confidence, participant address, local terminal ID, and scoped node ID.
- Terminal IDs are now scoped by participant using `participant::localNodeId`, so two players using the same node ID cannot share or overwrite a verdict.
- Settlement scoring now resolves each player's lattice against that player's scoped terminal verdicts.
- Refund accounting was fixed so refunds are credited to the same player payout key used by `withdraw()`.
- Added explicit refund exits for underfilled subjects and insufficient-evidence outcomes.
- Appeal bonds must now be exact, are tracked per subject, and are either moved to treasury after valid settlement or refunded when evidence is insufficient.
- Frontend contract wrapper was updated for the new refund methods.

## Verification

- Direct contract tests: `31 passed`
- Frontend lint: passed
- Frontend production build: passed
- StudioNet deployed contract read: `get_all_subjects` returned the seeded subjects successfully.

## Deployed Contract

Updated StudioNet contract:

`0x7Bca21bA9e4789A8A5A43e22cA6e8dCDda8a6166`

## Lifecycle Runs

I ran 3 complete lifecycle rounds on the updated contract:

`create subject -> join A/B -> commit A/B -> reveal A/B -> request resolution -> finalize -> withdraw A/B`

Final seeded subjects:

- Subject `1`: `CLAIMABLE`, 2 players, pot `0.002 GEN`
- Subject `2`: `CLAIMABLE`, 2 players, pot `0.002 GEN`
- Subject `3`: `CLAIMABLE`, 2 players, pot `0.002 GEN`

All three rounds produced validator resolution reports with participant-scoped terminal IDs and authenticated source URLs, then finalized and allowed both players to withdraw successfully.

## Live App

`https://cipher-six-eta.vercel.app`

## GitHub

Latest pushed fix commit:

`6a5393e Harden validator resolution and settlement paths`
