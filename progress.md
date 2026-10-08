# Workshop progress

## Status
- **Interview with Tamas:** TBD next week, probably Tue 13 or Wed 14 Oct 2026.
- **Plan:** Module 5 wrap-up (reverse query + JS SDK, kept short) → Module 6 (AI in Storyblok) → Module 7 (hands-on MCP server vs. CLI) → Module 8 (RAG over the CMS, reusing toSummary + webhook events) → Module 9 (interview synthesis + mock interview), finishing by Mon 12 Oct. Optional Module 10 (visual frontend + Visual Editor/Bridge) only if time allows.
- **Current:** Modules 1–6 complete (2026-10-08 11:45). Next: Module 7 (agents operating on content: MCP server vs. CLI, hands-on).

## Log

### Module 1: Why "headless"? (done 2026-10-07)
Scenario: the HW&T website on WordPress, one page per funded game.

What Jay worked out:
- A traditional CMS does three jobs: **editing** (admin UI), **storing** (content as labelled fields in a database) and **presenting** (theme templates turn content into HTML when a page is requested, not at publish time).
- Misconception fixed: "WordPress stores the published page." It stores the *content*. HTML is produced at request time. Jay's valid objection: a CSS-only redesign would restyle stored HTML. The scenario was tightened to structural changes (moved blocks, a new "related games" sidebar) to rule that out.
- **Why HTML fails AI consumers:** (1) the presentation decides what exists, so games the template doesn't show are invisible and answers come back incomplete; (2) the labels are lost, so the assistant can't reliably tell a genre field from a word in the pitch (the "Ember Hollow" example), and scraping breaks when the theme changes.
- **Why direct database access fails:** the app would ship DB credentials (extractable, giving access to drafts, users and write access), plus tight coupling to the internal schema.
- **Jay's own design:** an API that returns structured JSON, filtered on the server, with access scoped to the requester (limited and revocable keys).
- **Headless** = the CMS drops the presenting job. Every channel (website, app, AI assistant) consumes the same structured content through the API and presents it in its own way.

**Follow-up clarifications (Module 1):**
- *Editing UI* = the vendor's web app where non-developers fill in fields, upload assets, save drafts, preview, publish, and manage translations, roles and workflows (`/wp-admin` in WordPress). It stays in a headless CMS.
- *"Storyblok builds pages from blocks, so isn't that a head?"* No. A block is a **schema** (fields only, no markup or styles). Arranging blocks produces a **JSON tree**. The **Visual Editor loads the developer's own site in an iframe**, and the Storyblok Bridge connects clicks and saves between the two. The **developer writes one frontend component per block type** (`hero` → Hero component with its own HTML/CSS). Storyblok does editing and storing; the developer's frontend does presenting.
- Misconception fixed: Jay assumed Storyblok wrote the hero's HTML/CSS.

**Interview one-liner (Jay's summary, tightened):**
> "In Storyblok, editors create entries and compose pages from block types the developers defined. Each entry, such as a game, is a *story* of a content type like `game`, with its own fields. Storyblok stores all of it as structured JSON and serves it via API. Developers build the frontend, one component per block, so presentation lives in their code, not the CMS. That's what makes it headless, and it's also why the same content can feed a website, an app, or an AI agent."

Supporting points:
- "Users" are two roles: **editors** work inside Storyblok; **developers** write the frontend in their own codebase.
- The output isn't always HTML: the same JSON can feed native apps or AI assistants.
- Storyblok stores both the **definitions** (block/content-type schemas) and the **entries** (stories).
- **Content type blocks** = whole entries (post, article, page, game). **Nestable blocks** = pieces inside an entry (text, image, hero). There are also universal blocks, which can be either.
- Open question carried into Module 2: not all data about a game is CMS content (e.g. investment amounts, terms, milestones).

Interview takeaway: structured content behind an API is what makes a CMS usable by AI agents and assistants. A CMS that only produces pages forces AI to scrape and guess.

### Module 2: Content modelling (done 2026-10-07)
Deliverable: `content-model.md` (Game, Studio, Genre, Person).

What Jay worked out:
- **Studio as its own content type with a reference** (his DB analogy: table + foreign key). A rename happens once, and the assistant sees one stable entity instead of string variants ("Pixel Forge" / "PixelForge"). Storyblok calls these *references* and resolves them with the CDA's `resolve_relations` (e.g. `game.studio`); resolved stories come back in `rels`, max 50 per request.
- **Genre: free text vs. option list vs. content type.** He picked the option list to prevent typos and variants. Misstep fixed: "two entries for roguelike/roguelite" isn't what separates the options. The difference is that a content type can carry **its own fields** (description) that the assistant and the genre page can use as grounding.
- **Rule of thumb (his):** unique to one entry → field; shared label → option list; shared *and* carrying its own info → content type + reference. His first version ("if it's referenced elsewhere") was refined with the counter-example that option lists are shared too.
- **Confidential data stays out of the CMS** (investment amounts, terms). A CMS is built to publish; MCP/agents can reach the Management API. Composable = join by ID with a separate, authenticated system of record.
- **References go one way.** He removed `Person.games_produced` and `Genre.hwt_examples` after the Ana→Rui handover scenario (contradictory AI answers). Reason: the reference lives where the editor works, on the side with few links; reverse lookups are done with queries.
- **Missing fields = AI can't know** (added `description`, release info instead of scraping store pages).
- **Release timing modelled by precision:** `release_year` (number), `release_quarter` (Q1–Q4, optional), `release_date` (optional exact day). All empty = not announced, which replaced his checkbox idea that could contradict the data. Rejected along the way: a single `date` (false precision → placeholder dates stated as fact), free text (unfilterable), epoch number (still falsely precise; "the agent will work it out" = guessing). Trade-off noted: empty could also mean "forgot"; an explicit status option list would make it explicit.
- Slips corrected: `release_year` initially short text → number.
- Carry to Module 4: `link (many)` fields → a nestable block (e.g. platform + URL).

Interview takeaway: the content model decides AI answer quality. Clean option lists, references and honestly modelled precision give the assistant facts to look up instead of text to interpret.

### Module 3: Delivering content (done 2026-10-07)
**Reference: how Storyblok's CDN cache and `cv` work (corrected version, checked against docs 2026-10-07)**
- **Only Storyblok sets the version.** Each space has a `version` number that changes whenever content changes.
- **`cv` is an optional query parameter** (`...&cv=1791379452`) where the client says which version it's asking for. Published responses are cached at the CDN edge **per URL**, so each `cv` value has its own cached snapshots.
- **Getting the current value:** omit `cv` and the API redirects to the same URL with the latest `cv` (fetch follows the redirect automatically); or call `GET /v2/cdn/spaces/me?token=...`, which returns `version`.
- **What a sent `cv` gets you:**
  - current `cv` → current content (from cache if someone already asked; otherwise from the origin, then cached)
  - old `cv` that is already cached → **the old snapshot (stale)**, the only staleness case
  - invalid `cv`, or old `cv` never cached → redirect to the latest
- **After a publish**, old snapshots stay under old `cv` values but are only served to clients that keep reusing that old `cv`. Nothing needs purging.
- Unknown (docs silent): behaviour for a `cv` ahead of the current version.
- Token TTL: `cv = floor(version / ttl) * ttl`, trading up to TTL seconds of staleness for more cache hits.
- Numbers from docs: about 1,000+ req/s cached vs. about 50 req/s uncached (single stories).
- Correction logged: the first explanation wrongly implied the client chooses or creates the new `cv`. Jay caught it.

**Code:** `fetch-home.ts` fetches the Home story from the CDA (Node 24 runs `.ts` directly via type stripping, with no type checking). Built by Jay: `async` function, `await fetch` + `await response.json()`, token from `process.env.STORYBLOK_TOKEN`, `.then()/.catch()`, and `if (!response.ok) throw new Error(...)`.
- Bug caught: the function was defined but never called (Python `def` analogy).
- Learned: `fetch` only rejects on network failure; 404/500 resolve normally → check `response.ok`. Silent "success" with empty content would corrupt an AI index.
- Suggested polish: check that the token is set (otherwise you get a confusing 401 from `token=undefined`).

**What Jay worked out:**
- `version=published` for an unpublished story → 404. Unpublished content doesn't exist from the outside.
- **Tokens:** Preview = drafts + published (server-only); Public = published only, read-only, safe for the browser. A preview token in browser code exposes all drafts (unannounced games, embargoed dates).
- **AI framing:** what the token can read becomes what the assistant knows and can say. Public investor assistant → public token + published. An internal staff assistant could justify drafts. Match access to the audience.
- **CDN caching / `cv`:** see the reference above. Stale content comes only from reusing an already-cached old `cv`.
- **Polling vs. webhooks:** polling every minute = ~1,440 runs/day for ~1 change, wasted embedding cost, still up to 60 s stale. Jay inverted it: the server knows first and should notify → **webhooks** (POST to your URL; payload has `action`, `space_id`, `story_id`, `full_slug`, not the content; `webhook-signature` header for verification; secrets on paid plans).
- **Events the indexing pipeline must handle:** `published` (re-fetch + re-index), `unpublished` and `deleted` (remove from the index, and treat a 404 on re-fetch as "gone"), `moved` (`full_slug` changes, so cited source links would break). Jay first dismissed `moved`, then corrected himself.

Interview takeaway: delivery details (tokens, versions, caching, webhook events) decide whether an AI assistant is **safe** (no draft leaks), **fresh** (no stale cv, event-driven) and **honest** (removes withdrawn content, valid citations).

### Module 4: Storyblok's mental model (done 2026-10-07)
Built in the real space: content types `game`, `studio`, `genre`, `person`, `platform`; nestable block `link` (platform reference + Link field); entries created in folders and published; Ember Hollow fetched via `fetch-game.ts` (`/v2/cdn/stories/games/ember-hollow`, full slug works as the ID).

What Jay worked out:
- Field types (docs): Text, Textarea, Rich text, Markdown, Number, Boolean, Date/time, Asset, Multi-Asset, Link, Option (single/multi), References, Blocks, Table, Group, Plugin. Image → **Asset** (restrict to images; carries alt text, which the AI can read).
- **"Many labelled links"** → a nestable `link` block repeated in a **Blocks** field (min/max and allowed blocks configurable).
- Misstep fixed: an image field per link. Icons are presentation, and the AI can't read images, so a platform identity is needed.
- **Platform: option list vs. content type.** Jay chose a content type. Real trade-off = **editor autonomy** (an editor adds "Epic Games Store" alone) vs. **developer control** (option list + icon in code needs a schema change, a code change and a deploy). Consistency is equal either way.
- Schema permissions vs. content permissions are separate roles; schema changes affect every entry and the frontend.
- "Developer" = whoever builds HW&T's frontend (in-house, freelancer, agency, or Jay). "Deploy" = releasing frontend code, separate from publishing content.
- **References come back as UUID arrays** (predicted correctly), even with max 1. Raw response → the AI can't answer genre or wishlist questions.

**Friction list (DevRel material):**
- UI label "Multi Options (References)" vs. docs "References".
- A single-reference field (max 1) still returns an array, so consumers must index `[0]` and handle empty.
- The Visual Editor preview is empty without a frontend (expected, but worth checking the messaging).

Tooling: VS Code JavaScript Debug Terminal for breakpoints in `.ts` (Node type stripping keeps line numbers).

### Module 5: Storyblok's APIs and SDKs (done 2026-10-08)
File: `fetch-game.ts` (fetches `games/ember-hollow`, published, with `resolve_relations`, and builds `toSummary(data)` text for the AI index).

What Jay worked out:
- **`resolve_relations`** = the API-side JOIN. Format: `<block that directly defines the field>.<field>`, comma-separated. Final value: `game.genre,game.studio,game.hwt_producer,external_link.platform`. Resolved stories land in **`rels`**; the game's own fields **stay UUID arrays**, so code must match by `rel.uuid`. Max 50 per request (the rest go to `rel_uuids`).
- Misconceptions fixed: (1) `game.store` doesn't work, because `store` is a Blocks field and not a reference; (2) it isn't a path from the top (`game.store.link.platform.name`), you name the owning block (`external_link.platform`); (3) no sub-fields, since the whole story comes back.
- **Empty `rels` debugging:** he formed and tested the hypothesis himself (the referenced Genre was saved but not published). **Publishing is per story**; options for several at once: Releases, Management API/CLI.
- Renamed `link`→`external_link` / `url` (the Storyblok changelog says renames migrate content automatically; live frontends must handle both names during migration).
- **Three IDs per story:** `id` (number), `uuid` (what references store), `content._uid` (block instance). He searched the wrong one at first.
- **Data contradiction** (`release_year` 2025 vs `release_date` 2027): the model allowed it, so he **removed `release_date`** (quarter precision is enough for games in development). Alternative: derive the year/quarter from the date.
- **toSummary code lessons:** `find` + `?.` + `??` so a missing reference degrades to "Unknown" instead of a TypeError crash (`??` alone fails because `.content` throws first); handle *many* studios/producers with **`map` + `join`** (map = Python list comprehension; braces need an explicit `return`); `+` binds tighter than `??`; `??` doesn't catch `""`. Release line: year empty → "TBD"; quarter empty → year only; else "Qn YYYY".
- Fallback wording matters for AI: "Unknown" may be repeated as fact; omitting the line is an alternative.

**SDK rewrite details:** setup `npm init -y`, `npm pkg set type=module`, `npm install @storyblok/api-client`. Client created once at module level (the cache is in-memory per client). `client.stories.get(id, {query})` vs. `client.stories.list({query})` (get("games") → 404: the folder isn't a story). `if (error) throw error` restores fail-loud (`throwOnError` is false by default). Learned: **resolve_relations = server sends the stories (rels); inlineRelations = client swaps the UUIDs for the stories in content**; only exact matches get inlined. Unresolved refs stay UUID strings → still need `?.content?.name ?? 'Unknown'`; hit the `+` vs. `??` precedence trap a second time and fixed it with parentheses.

**SDK one-liner (Jay's, tightened):**
> "Compared with raw fetch, the client handled the plumbing (URLs and tokens, cache versioning and caching, retries and rate limits) and, with `inlineRelations`, put the referenced stories directly into the fields instead of leaving me to join them from `rels`. What stayed with me was the <mark><u>**policy**</u></mark>: failing loudly on errors (it doesn't throw by default), deciding what to say when a reference isn't published, and shaping the content into something an AI agent can use."

**Friction list additions:** a Number field is returned as a string (`'2025'`); three similar-looking IDs (`id` / `uuid` / `_uid`); an unknown or misspelled query parameter may fail silently (looks like "resolve doesn't work").

**Pending (resume here):**
1. ~~Links~~ DONE 2026-10-07 23:20: `toSummary` complete (labelled social links + stores via map/join, single Release line, safe fallbacks). Reuse it in Module 8.
2. ~~Reverse lookup~~ DONE 2026-10-08: `fetch-producer-games.ts` (slug param → fetch person → `uuid` → `GET /v2/cdn/stories?content_type=game&filter_query[hwt_producer][any_in_array]=<uuid>`). Learned: list endpoint (`stories` array) vs. single story (`/stories/<slug>` = one identifier, not a folder listing); `starts_with` (folder) vs. `content_type` (type, more robust); filters need the **UUID**, not the name; `any_in_array` (OR) vs. `all_in_array` (AND); distinct error messages per step; **empty result ≠ 404 ≠ unknown** (three different assistant answers). Tooling: `.env` + `node --env-file=.env`, VS Code `"envFile"` in launch.json; never commit `.env`.
3. JS SDK DONE 2026-10-08 (`fetch-game-sdk.ts`): `@storyblok/api-client` (docs: "modern TypeScript client for the CDA"): `createApiClient({accessToken, region})`, `client.stories.get/list`, returns `{data, error}` (throwOnError false by default), `cv: 'auto'` + in-memory cache for published requests (60 s TTL, drafts never cached), retries (3, with backoff), preventive rate limiting, typed responses, `inlineRelations: true` (replaces UUIDs with stories; docs warn about cyclic references). Jay's insight: **his one-way reference model can't cycle** (only Game and external_link hold references; the targets hold none). Removing `Person.games_produced` / `Genre.hwt_examples` in Module 2 is what keeps inlining safe.

### Module 6: AI inside Storyblok (done 2026-10-08)
Discussion module. Sources: AI Suite page, AI Branding changelog (Aug 2025), AI credits page, Custom AI features page, AI terms (effective Apr 22 2026), folder-level AI translation changelog (Dec 2025).

What Jay worked out:
- **Why AI inside the CMS vs. a ChatGPT tab:** (1) **context**: the CMS holds the structured facts (caveat: documented context = AI Branding's business context/voice; whether generation pulls referenced stories automatically is unverified, so raise it as a question with Tamas); (2) **governance**: personal tabs = unreleased game info sent wherever, under unknown terms, with no visibility. Storyblok: named providers (OpenAI, Google Cloud, Anthropic, Irish entities), "Input is not used to train", AI can be disabled, **Bring Your Own AI** (Elite: own provider/credentials/models, e.g. OpenAI/Gemini, fine-tuned) → one known, contractual, switchable path; (3) **consistency**: five tabs = five voices → **AI Branding** (business context, voice/tone, always/avoid/never-use terms, output rules, org-level style groups overridable per space; Basic on Premium+Elite, Advanced on Elite). Parallel to Module 2: option lists keep *data* consistent, AI Branding keeps *prose* consistent.
- **Human oversight** (terms: "Customer must ensure appropriate human oversight before... publishing any Output"): the gate is **draft → human Publish**; the public token + published version means unreviewed AI drafts are invisible to consumers (Module 3). Stronger: workflow stages, releases. First answer ("in the Visual Editor") corrected: that's where AI writes, not a gate.
- **Scale problem** (folder-level AI translations: 40 games × 2 languages): review bottleneck → rubber-stamping risk. Key insight: with **structured content, AI only touches text fields** (per game: `description`; genre text lives in the Genre story, translated once). Facts (numbers, options, references, URLs) can't be mistranslated. → 80 descriptions + a few genres, not 80 full pages. *Structured content limits what AI can get wrong, which makes human oversight manageable at scale.* (Jay first said genre is translated per game; corrected: it's a reference.)
- **AI as an outside reader:** Otterly.AI partnership (AI search monitoring across ChatGPT, Perplexity, Google AI Overviews, etc.). Why: AI tools will answer questions about your company and you want them to be accurate. External AIs only see the published pages (no API token), so clean pages, AI SEO and alt text matter (ties back to Module 1).
- AI credits: monthly, token-based (input + output), image tasks cost more; Content Generation + Translations on all plans, Alt Text Growth+, SEO Premium+.

Interview takeaway: AI inside a CMS is sold on **context, governance and consistency**, and kept safe by **structure + the publish gate**.

**Question to ask Tamas (unverified, so ask rather than claim):**
> "When the AI writes a field, how much of the surrounding content does it see? For example, would it pick up the referenced genre or studio, or does it rely mainly on the AI Branding context?"
(The "referenced stories" are the entries a story points to via reference fields. For Ember Hollow: its Genre, Studio, Producer (Person) and Platform stories.)

## Pending assignment
_(none)_
