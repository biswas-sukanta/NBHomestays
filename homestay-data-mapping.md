| UI Section | Backend Field | Evidence |
| --- | --- | --- |
| Gallery | `media` | `artifacts/homestay-ux-integrity/homestay-response.json` shows 3 `media[]` records; page maps them into `galleryMediaUrls`. |
| Hero summary | `description` | Overview card uses `truncateText(descriptionText, 120)` where `descriptionText` prefers `homestay.description`. |
| Stay Story | `description` | `Stay Story` renders `homestay.description?.trim() || homestay.editorialLead?.trim()`. |
| Experience Highlights | `tags` with visual accents from `trustSignals` / `vibeScore` | Runtime payload contains 10 tags and 1 trust signal; page renders 4 highlight cards from `visibleTags`. |
| Room Types | `spaces` | Runtime payload contains 3 `spaces`; page renders 2 room cards after filtering out the `outdoor` record to avoid misclassification. |
| Know Before You Go | `quickFacts` | Runtime payload contains 7 `quickFacts`; `QuickFacts` section renders from `homestay.quickFacts`. |
| Meals | `mealConfig` + `mealPlanLabel` | Runtime payload contains `mealConfig` and `mealPlanLabel`; `MealsSection` receives both. |
| Host | `hostDetails` + `host` | Runtime payload contains host bio, languages, years hosting, reviews count, and host identity; `HostProfile` renders from those fields. |
| Policies | `policies` | Runtime payload contains 16 policy strings; `PoliciesSection` renders from `homestay.policies`. |
| Property Tour | `videos` | Runtime payload contains 1 YouTube `videos[]` item; page converts it to an embed URL and renders the tour. |
| What Makes This Place Unique | `vibeScore`, `hostDetails`, `mealPlanLabel`, `trustSignals` | Runtime payload contains all four and page derives 5 icon bullets directly from them. |

Runtime proof:
- Logged live payload during validation from `page.tsx`, then removed the temporary log before finalizing.
- Exact backend response saved in [artifacts/homestay-ux-integrity/homestay-response.json](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/artifacts/homestay-ux-integrity/homestay-response.json).

Key data notes from the real listing:
- `tags`: 10 values
- `media`: 3 values
- `spaces`: 3 values, including one `outdoor`-named record
- `videos`: 1 value
- `quickFacts`: 7 values
- `policies`: 16 values
- `hostDetails.languages`: 6 values
