# Mock interviews — Tamas Piros style

Module 9 (interview synthesis). Claude played Tamas Piros (Storyblok DevRel manager, ex-Director of Developer Advocacy at Cloudinary, AI-fluency focus). One question at a time, feedback after each answer.

# Round 1 (2026-10-12)

## Q1. "A developer has a WordPress site and is building an AI assistant that answers questions about their products. Why move content to something like Storyblok?"

**Jay:** A WordPress site isn't built for an AI assistant; the data is guided by presentation, so anything in the CMS that's hidden by the presentation is unreachable by the assistant, even if it's valid, relevant information. Storyblok's headless CMS lets you give the assistant access to all the relevant information, and only the information it should have, via our SDK, APIs or an MCP connection.

**Feedback:**
- Good: led with content shaped by presentation; ended on access control.
- The WordPress claim is too broad: WordPress has a REST API and "headless WordPress" exists. The accurate point: WP content is mostly a rich-text/HTML body, where facts are buried in prose. In Storyblok each fact is a **field**, and relations resolve to names.
- Use your evidence: "I pointed my Python RAG service at a Storyblok space: one story = one chunk from typed fields; asking which games a studio was working on found all four."
- Give the mechanism for "only what it should have": Public token = published only (`version: draft` → 401, verified).
- DevRel credibility: "you don't have to migrate everything on day one".

## Q2. "WordPress has a REST API too: I can call `/wp-json/wp/v2/posts` and feed it to the assistant."

**Jay (after a hint):** That still returns a block of HTML that needs to be parsed by the assistant. Storyblok's responses are structured: the data is in separate, labeled fields that are easily accessible to the AI agent.

**Feedback:**
- Correct detail: the endpoint returns JSON, but the body is an HTML string (`content.rendered`).
- Expect "LLMs read HTML fine": they do; the problem is that prose is inconsistent and can contradict itself (Fruitbot vs "by Coffeenauts", Module 8). One fact, one field.
- Structure also enables **filtering** (`filter_query` by studio UUID) and **references** (rename a studio once, every game updates).
- Concede: WordPress can do structured fields with plugins (e.g. ACF); in Storyblok it's the default model, not an add-on.

## Q3. "A marketing editor saves an unannounced game without publishing. Could the assistant leak it?"

**Jay:** If properly configured, the assistant uses a Public token, which only gives access to published content, so saved, unpublished content isn't reachable.

**Feedback:**
- Correct. Spell out "properly configured": the mistake is a **Preview** token, where `version: "published"` in code is the only guard. Fix at the credential, not the code.
- Evidence: "I tested it: Public token + `version: draft` returns a 401. It fails loudly instead of leaking quietly."
- Other ways it could still leak: an accidental publish (`--publish all` publishes *never published* and *taken offline* stories, Module 10.5); stale copies in the index/semantic cache (webhooks don't retry → scheduled rebuild).

## Q4. "You listed MCP as a way to connect the assistant. Does the same protection apply?"

**Jay (after a recap of Module 7):** MCP acts as the administrator/manager of the space, so it does have access to unpublished data, but that's expected; its use is different from an AI assistant.

**Feedback:**
- Right distinction. Refine: MCP acts **as the user who authorised it, with the scopes granted** (OAuth, least privilege), not admin by default.
- Correct yourself out loud: "I'd take back MCP for a customer-facing assistant. MCP is for the people who manage content; the public assistant reads through the CDA with a Public token."

## Q5. "Tell me one thing in Storyblok's DX that frustrated you, and what you'd do about it."

**Jay:** Migrations and the `--publish` parameter confused me a lot until it clicked: a migration touches and updates everything, but only publishes the ones selected by `--publish`. I kept a friction log of other issues that I'm happy to share.

**Feedback:**
- Good pick (real, struggled, now explainable); offering the friction log is excellent.
- Be precise: "a migration updates the **draft** of every story it matches; the `--publish` mode decides which get published, based on each story's **state**."
- You skipped the second half: what you'd do about it (follow-up Q5b).

## Q5b. "Concretely, what would you do about the migrations confusion?"

**Jay:** First introduce the concept and difference of draft vs published, and visually show the process for the different story states, before jumping to the command itself.

**Feedback:**
- Concept before command is a good teaching instinct, and it's how it clicked for you (Module 10.5).
- Use the four **states** precisely: never published · published and clean · published with pending edits · taken offline. "Unpublished" is ambiguous (`--publish all` puts *taken offline* back live). Your tested mode × state table is the visual; mention you tested every cell.
- Add the product-feedback lever: dry run should list which stories would be published; warn when running without `-d` or `--publish`; docs should say a skipped story is never published.
- Name a deliverable: "Migrating 500 stories safely" with the five-step playbook.

## Q6. "How do you use AI day to day, and where doesn't it help?"

**Jay:** At work, I created repo-specific skills and instructions to work with IQGeo's product APIs. Personally, I built a production-ready RAG solution on containers with Loki, Promtail and Grafana, now plugged into my Storyblok space. I'm studying how AI works under the hood and building a Unity game with Claude Code. It doesn't help when I'm learning and it writes the code for me; I use it to teach concepts and write the code myself. All my Storyblok work these past days has been like this.

**Feedback:**
- Strong: concrete, broad, and the "doesn't help" point is honest and distinctive.
- Be ready for a probe on "production-ready": RAGAS faithfulness gate, semantic cache, Loki/Grafana; and a known gap (cached answers go stale after re-ingest).
- Add a story about AI being wrong: the suggested `published` → `published-with-changes` sequence left Ember Hollow unpublished; the nonexistent `getAll` in `@storyblok/api-client`. Lesson: verify by experiment.
- Connect to the job: tool descriptions and MCP server instructions are documentation written for models.

## Q7. "Developers will increasingly learn Storyblok through an AI assistant. What does that change for DevRel?"

**Jay:** It should work by adjusting the delivery. I have a skill that creates Socratic training on topics I ask about, and it's worked very well for me. A "Storyblok workshop in the Socratic method" that tells a consistent story on how to start building your CMS could be a deliverable that uses AI to deliver a (somewhat) consistent experience.

**Feedback:**
- Original and personal, with evidence: this week was that format. Say so.
- "Adjusting the delivery" is vague and misses the bigger risk: assistants can be out of date (`in_array` vs `any_in_array`, old-client `getAll`). Actions: keep samples and SDK types current, deprecate loudly, treat MCP server instructions as docs, **test AI assistants on common Storyblok tasks** and fix the source material.
- Turn "(somewhat) consistent" into a design point: fix the curriculum, checkpoints and verified facts; let the AI handle only the conversation (same split as CLI vs MCP).

## Q8. "In the Visual Editor, editing a referenced studio's name shows a UUID in the preview until reload. What's going on?"

**Jay:** Perhaps they're using the story itself, not the content (I made that mistake many times). → After a hint: is it missing the relations?

**Feedback:**
- `story.name` vs `content.name` gives a *wrong name*, not a UUID. Read the clues: **UUID** = unresolved reference; **fine after reload** = initial fetch is fine, the live path isn't.
- Full answer: the Bridge's live update needs its own `resolveRelations` in `useStoryblokBridge`; resolve in **two places** (fetch and Bridge). First-hand: a comma-separated string left updates unresolved; an **array** fixed it (friction #12d).
- As DevRel: ask to see their Bridge call; docs callout + example showing both places; raise with the SDK team that a string is silently accepted.
- When unsure, reason from the symptoms out loud.

## Q9. "What questions do you have for me?"

**Jay:** The team is established across the US and Europe; how does it work together, and what are the next steps in the process?

**Feedback:**
- Good, practical questions, but generic. Add one only you could ask, from the friction log:
  - "I couldn't find a way to publish a single field; a migration's fix goes live with whatever else is in the draft. Deliberate design choice, or on the roadmap?"
  - "As developers learn Storyblok through AI assistants, how does the team find out when those assistants get it wrong?"

---

## Debrief, round 1

**Strengths**
- Answers grounded in what you built: the RAG integration, the Public-token 401, migration experiments, the friction log.
- Concept-before-command teaching instinct, proven on yourself.
- Honest, distinctive point about AI not helping while learning.

**Patterns to fix**
1. Lead with your evidence: "I tested it, and here's what happened."
2. Answer every part of the question.
3. Avoid absolute claims about competitors; concede the edge case, then make the real point.
4. Precise terms: "the draft of every matching story", *never published* / *taken offline*, not "unpublished".
5. When unsure, reason from the symptoms out loud.

**Anecdotes ready to use**

| Topic | Anecdote |
|---|---|
| Access control | Public token + `version: draft` → 401 |
| Publish modes | Tested mode × state table; `all` puts *taken offline* stories back live |
| Content quality | Fruitbot vs "by Coffeenauts": one fact belongs in one field |
| Bridge | `resolveRelations` as a string left live updates unresolved; an array fixed it |
| AI being wrong | `published` → `published-with-changes` left Ember Hollow unpublished |
| RAG | Storyblok → Python RAG, one story = one chunk; Small Hours question found all four games |

---

# Round 2 (2026-10-12)

Different questions, harder follow-ups.

## Q1. "Walk me through one content-modelling decision you made for HW&T, and why."

**Jay:** Games hold references to studios, genres and producers, but not the other way round: (1) games change more often, so references on the other side would mean more places to edit and more risk of staleness; (2) to avoid circular references.

**Feedback:**
- Clear decision with reasons. Sharpen reason 1: a relationship stored on **both** sides is two places that can disagree; one side = one source of truth ("one fact, one field").
- Reason 2 is weak: circular references aren't forbidden; make it about consistency and maintenance.
- Name the trade-off (explained on pause): reading the other direction needs an extra (reverse) query, and editors can't see or order a studio's games on the studio story (a curated order would argue for storing it on the studio).

## Q1b. "Then how does a studio page list all its games?"

**Jay:** Get the stories of type game, filtering by the studio's ID.

**Feedback:**
- Right approach. Use the **UUID** (reference fields store UUIDs; Module 8) and the operator: `filter_query[studio][any_in_array]=<uuid>`, because `studio` is multi-value (Siegeworks has two). SDK types still call it `in_array` (friction #12b).
- Full version: "Query the CDA for `content_type: game` with `filter_query[studio][any_in_array]` = the studio's UUID. One extra request; the cost of storing the relationship only on the game."

## Q1c. "The site is statically generated. An editor publishes a new game for Small Hours Collective; the studio story didn't change. What happens to the studio page?"

**Jay (paused):** Torn between CDN/`cv` and webhooks; leaning webhooks since the site is static. → Which studio pages to rebuild? "By the game's studio list."

**Feedback:**
- `cv` (Module 3) keeps the **API** fresh; a static page doesn't call the API on visit, so only a **rebuild** fixes it. Order: webhook triggers rebuild → rebuild fetches with fresh `cv`.
- Forward lookup: webhook gives the game's `story_id` (no content) → fetch the game → read `studio` UUIDs → rebuild the game page plus those studio (and genre/producer) pages.
- Tip: think out loud ("static, so API freshness isn't enough; something must trigger a rebuild; the trigger names the game, so work out which pages depend on it").

## Q1d. "The editor reassigns the game from Small Hours to Pixel Tide and republishes. You rebuild Pixel Tide. What's still wrong?"

**Jay:** The Small Hours page became incorrect when the wrong info was published, and it still is.

**Feedback:** Correct, in one sentence. The fetched game only shows its **current** studio.

## Q1e. "How do you fix that, when neither the webhook nor the game tells you the old studio?"

**Jay:** I don't remember.

**Feedback (not covered before; a reasoning question):**
1. Keep your own record of the previous build (`{game_id: [studio_uuids]}`, like the `game_slugs.json` sidecar); diff old vs new; rebuild both.
2. Rebuild more than needed: all studio pages or the whole site (cheap at 4 studios; Module 8 safety net: webhooks fast, full rebuild correct).
3. Don't make the list static: fetch at request time or in the browser.
- Pick by scale: "At 4 studios, rebuild every studio page on any game publish. At thousands, diff against the previous build."
- Tip: say "I haven't hit this, let me reason about it", then think through options out loud.

## Q2. "30 minutes at a meetup to show Storyblok + AI. What's your demo, and what's the one thing people leave with?"

**Jay:** The MCP server integration with an AI agent for CRUD on stories, showcasing the control granularity. I used MCP to populate my space easily, which let me work better with the SDKs and integrate my RAG solution.

**Feedback:**
- Good, authentic choice (OAuth scopes, approval gates).
- Missed the second half again: the one takeaway. E.g. "Storyblok is where your AI's facts live: structured, permissioned, and behind a publish gate."
- Give it an arc: empty space → agent creates games/studios via MCP → destructive-tool confirmation and publishing as a parameter → RAG answers from **published** content only → edit a draft, the assistant correctly doesn't see it (makes the publish gate visible).

## Q2b. "LLM demos are risky on stage. How do you prepare?"

**Jay:** Have a separate space with the output of an AI session, so if it's not live, at least show a proper result.

**Feedback:**
- Solid first layer. Add: constrain the prompt (name the system and space ID; plan readback before executing); let the approval gate catch a wrong tool (that's the point of the demo); reset the demo space with a CLI script (CLI repeatable, MCP for the AI part); recorded video for network failure.

## Q3. "The talk went well. Two weeks later, how do you know it worked?"

**Jay:** Add trackers to the CTA links at the end (docs, getting-started guide, DevRel space) and compare the number who accessed them against audience size.

**Feedback:**
- Concrete, from experience. Clicks = interest, not success: follow to **activation** (signup → space created → first API call → first published story).
- The talk's goal sets the metric (awareness → reach; "build with AI" → people building: demo repo forks, community questions about the pattern).
- Qualitative signal: what people asked afterwards = next content + friction for the product team.

## Q4. "You've used Storyblok for a week; others have used it for years. Why hire you?"

**Jay:** Years of DevRel across industries; I can present to one person or 500, from decision makers and C-level to engineers. On the technical side, I've worked with very different tools and products and learned them quickly, and I have experience with this tech stack in other "skins" and industries.

**Feedback:**
- Right ingredients. Turn the weakness into the strongest point, with this week as evidence: "A week ago I'd never used a headless CMS. Since then I've built a space, a Visual Editor frontend, migrations with every publish mode tested, a RAG integration, and logged 25 friction points. Long-time users stop noticing those; I noticed them because I was the new developer, and that's who DevRel serves."
- Replace "other skins" with names: Unity (keynote, talks across several countries), IQGeo (API skills), the RAG stack.

---

## Debrief, round 2

**Better than round 1**
- Shorter, more direct answers (the stale Small Hours page in one sentence).
- Real experience: tracked CTAs; a demo built on how you actually populated your space.

**Still recurring**
1. Two-part questions answered halfway ("one thing to leave with"). Count the parts before answering.
2. Lead with your evidence (this week, in the final question).
3. "I don't remember" on something new → "I haven't hit this, let me reason about it."

**Precise terms:** UUID, not ID, for reference filters; `any_in_array` for multi-value fields.

**New concepts**

| Topic | Key point |
|---|---|
| One-way references | One source of truth; cost = reverse query, plus no editor-controlled ordering on the studio side |
| Static sites | `cv` keeps the **API** fresh; only a **rebuild** (webhook-triggered) refreshes built pages |
| Dependent pages | Webhook names the game → fetch it → rebuild its studio, genre and producer pages |
| Reassigned studio | Old studio isn't recoverable: keep a record of the previous build, rebuild more than needed, or don't build that list statically |
| Live AI demos | Constrained prompt + plan readback, approval gate as the point, CLI reset, recorded backup |
| Measuring a talk | Clicks = interest; activation (signup → space → first API call) = success; the talk's goal sets the metric |
