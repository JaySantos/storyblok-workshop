# Storyblok friction log

Developer-experience friction found while building the HW&T workshop project (Oct 7–8, 2026).
Each entry: what happened → why it matters to a developer → a possible fix.
"Verified" = reproduced or seen directly; "To check" = observed once or unconfirmed.

## Content modelling & editor UI

| # | Area | What happened | Developer impact | Possible fix | Status |
|---|------|---------------|------------------|--------------|--------|
| 1 | Block Library | The References field is labelled **"Multi Options (References)"** in the UI, but the docs call it **"References"**. | People following the docs can't find the field by name. | Align UI label and docs, or mention both in the docs. | Verified |
| 2 | References | A reference field limited to **max 1** still returns an **array** (`genre: ["uuid"]`). | Every consumer must write `genre[0]` and handle the empty case; easy to forget. | Document it prominently, or offer a single-value reference shape. | Verified |
| 3 | Field types | A **Number** field (`release_year`) comes back as a **string** (`'2025'`) from the API, and the generated type is `release_year?: string`. | Numeric comparisons (`year <= 2027`) silently compare text unless converted. | Return numbers as numbers, or document the string behaviour clearly. | Verified |
| 4 | Schema | `release_quarter` options were missing **Q2** for two days, and nothing surfaced it. Only `types generate` made it visible. | Silent schema mistakes that editors and developers don't notice. | Not a product bug (user error), but a good argument for promoting type generation and schema review. | Verified (own mistake) |
| 5 | Visual Editor | Without a frontend, the preview pane is empty/broken. | Expected for headless, but confusing for first-time users. | A clearer empty-state message explaining a preview URL is needed. | To check (messaging) |

## Content Delivery API

| # | Area | What happened | Developer impact | Possible fix | Status |
|---|------|---------------|------------------|--------------|--------|
| 6 | IDs | Each story has three ID-like values: `id` (number), `uuid` (what references store) and `content._uid` (the block instance). They look alike. | Matching references against `content._uid` silently finds nothing. | A short "which ID is which" section in the docs. | Verified |
| 7 | Query params | A misspelled `resolve_relations` produced no error, just unresolved UUIDs. | Looks exactly like "resolving doesn't work"; a common support question. | Warn on unknown parameters, or echo the applied params in the response. | To check (whether unknown params are always ignored silently) |
| 8 | resolve_relations | When a referenced story is **saved but not published**, `rels` is simply empty with no hint why. | Hard to debug; the cause (per-story publishing) isn't obvious to newcomers. | Mention it in the resolve_relations docs/troubleshooting. | Verified |
| 9 | Publishing | Publishing a story doesn't publish the stories it references; there's no obvious "publish with dependencies". | Newcomers expect a cascade. | Docs note, or a "referenced stories are unpublished" warning on publish. | Verified (behaviour); bulk options: Releases, API/CLI |
| 10 | Docs gaps | Couldn't confirm in the docs: bulk publish from the content list; which plans include Releases. | Uncertainty when advising users. | Document both explicitly. | To check |

## JS SDK (`@storyblok/api-client`)

| # | Area | What happened | Developer impact | Possible fix | Status |
|---|------|---------------|------------------|--------------|--------|
| 11 | Errors | `throwOnError` is **false** by default: the client returns `{ data, error }` and doesn't throw. | If `error` isn't checked, failures surface later as `data` being `undefined`. | Fine as a design choice, but make "always check `error`" prominent in quickstarts. | Verified (docs) |
| 12 | Relations | With `inlineRelations`, unresolved references (unpublished, or not in `resolve_relations`) stay **UUID strings** in the same field. | Field type is `story | string`; code must handle both (the generated types make this explicit). | Docs example showing the mixed case. | Verified |

## MCP server

| # | Area | What happened | Developer impact | Possible fix | Status |
|---|------|---------------|------------------|--------------|--------|
| 13 | Docs vs server | Docs page describes a **3-step** workflow (search → describe → execute); the server's own instructions describe **4 steps** (adds "pick the execute tool from `executeWith`"). | Minor inconsistency between human docs and model-facing instructions. | Align wording. | Verified |
| 14 | Permissions | With least-privilege OAuth (no space-listing permission), the agent couldn't find the space and asked for the ID. | Reasonable, but the cause (missing permission) wasn't stated. | Error/agent hint: "listing spaces requires permission X; or provide the space ID". | To check (exact message) |
| 15 | Publishing | `publish` is a **parameter** of `createStory`/update, not a separate permission, so "Stories: write" lets an agent publish. | The draft→publish human gate can be bypassed by an agent with write access. | Consider a separate "publish" scope for OAuth/MCP, or document the implication. | Verified (`describe(createStory)`); separate scope: to check |

## CLI (v4.23.4)

| # | Area | What happened | Developer impact | Possible fix | Status |
|---|------|---------------|------------------|--------------|--------|
| 16 | components pull | Docs list `components.json`, `groups.json`, `presets.json`, `tags.json`; only `components.json` was written. The log showed groups/presets/tags with count 0. | Looks like a failure to first-time users. | Print "no groups found, skipped", or document the behaviour. | Verified |
| 17 | types generate | Docs say `storyblok-component.d.ts`; the CLI generates **`storyblok-components.d.ts`** (plural). | Copy-pasted import paths from the docs fail ("Cannot find module"). | Fix the docs. | Verified |
| 18 | types generate | Without `--strict`, generated interfaces include `[k: string]: unknown`, so typos like `release_quater` aren't flagged. | Default output gives weaker safety than people expect from generated types. | Consider `--strict` as the default, or explain the trade-off in the docs. | Verified |
| 19 | types generate | Generated types import `ISbStoryData` from **`@storyblok/js`**, while the recommended client is `@storyblok/api-client`. | Developers must know to import from a package they didn't install directly (present via the CLI's dependencies). | Re-export the needed types from the generated file or the api-client. | Verified |
| 20 | stories pull | In `--dry-run`, output says **"Saving stories… 14/14 succeeded"** right under "No changes will be made". | Contradictory wording; unclear whether anything was written. | Say "Would save 14 stories". | Verified |
| 21 | stories pull | `--dry-run` still creates a `.storyblok/reports/` folder. | Unexpected files after a "no changes" run. | Skip reports in dry-run, or document it. | Verified |
| 22 | migrations run | `--help` lists `--publish <publish>` as `all \| published \| published-with-changes` but never says what each mode does. Without the flag, the migration only updates the **draft**, so the next editor who clicks Publish ships it unknowingly. | Developers guess from the names; a wrong guess can publish other people's unfinished drafts (e.g. "TEST EDIT"). | One line per mode in `--help` and the docs, plus a note on what happens with no `--publish`. | Verified (help text, draft-only behaviour, and mode semantics by experiment on 2026-10-09: `all` = every migrated story incl. never-published; `published` = only live stories with no pending edits; `published-with-changes` = only live stories with pending edits, which ships those edits). Also: a story the migration **skips** (no change) is **not published** even if it matches the mode, and the output never says what was published, only "updated". |
| 23 | Draft vs published | A story has one draft and one published version, and publishing always sends the **whole draft** live (afterwards `unpublished_changes` is false). There's no field-level publish (none found; per-language publish exists), and `migrations run` has no option to target the published version. Also, an unpublished story shows `unpublished_changes: false` ("taken offline") while a never-published one shows `true`. | Mental model is hard: a migration on a story with pending edits can't go live without shipping those edits, short of a custom Management API script (migrate published → publish, then re-apply to the saved draft). Easy to get wrong. | A docs page on "migrations and pending edits" with the four publish outcomes in a table; consider a `--version published` option. | Verified (behaviour seen today); field-level publish and the custom-script approach: to check |

## Open questions (not friction, but worth asking)

- Does AI content generation use **referenced stories** (genre, studio…) as context, or mainly the AI Branding settings?
- Is there (or should there be) a separate **publish** permission for OAuth/MCP clients?
- Does Storyblok keep an activity log showing **who** changed a schema in the UI?
- Is there field-level publishing, or a way for a migration to target the **published** version of a story (so pending edits aren't shipped)?
