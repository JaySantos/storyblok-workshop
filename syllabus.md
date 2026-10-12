# Headless CMS + Storyblok, in an AI context: a Socratic workshop

**Goal:** prepare Jay for the technical interview with Tamas Piros (manager, Storyblok DevRel team) for the Developer Relations Engineer role.
**Starting point:** no prior knowledge of headless CMS or Storyblok.
**Format:** guided questions, one at a time. Jay writes all the code. Hands-on modules use real TypeScript/JavaScript against a free Storyblok space.
**TypeScript support:** new syntax or tooling is named and explained briefly when it first comes up (types, `async/await`, `fetch`, env vars, running `.ts` files). Jay still writes the implementation.

## Modules

| # | Module | Type |
|---|--------|------|
| 1 | **Why "headless"?** What a traditional CMS couples together, and what changes when you remove the "head" | Discussion |
| 2 | **Content modelling.** Structured content versus pages. Model a real case (an HW&T game portfolio) | Exercise (on paper/JSON) |
| 3 | **Delivering content.** APIs, draft vs. published, caching/CDN, webhooks. Set up Node + TypeScript and fetch content | Hands-on |
| 4 | **Storyblok's mental model.** Spaces, stories, components/blocks, nesting, Visual Editor and bridge. Build the Module 2 model in a real space | Hands-on |
| 5 | **Storyblok's APIs and SDKs.** Content Delivery API vs. Management API, tokens, the JS SDK | Hands-on |
| 6 | **AI inside the CMS.** Storyblok AI Suite (translations, SEO, alt text, branding, bring-your-own model/tokens); governance and trust trade-offs | Discussion |
| 7 | **Agents operating on content.** Storyblok MCP server vs. CLI; when an LLM should or shouldn't be in the loop | Hands-on |
| 7.5 | **The Storyblok CLI, the deterministic counterpart to MCP.** (1) install and log in with a Personal Access Token; (2) `components pull`: the content model as files in Git; (3) `types generate`: replace `any` in `fetch-game-sdk.ts` with generated TypeScript types; (4) `stories pull`: export/backup with `--dry-run`; (5) **migrations**: a scripted bulk change (e.g. normalise `release_quarter` `q1`→`Q1`) with `--dry-run`, run, and rollback snapshot; (6) closing: when MCP, when CLI | Hands-on |
| 8 | **The CMS as an AI data source.** RAG over structured content, webhook-driven re-indexing, AI search visibility (builds on the earlier RAG workshop) | Hands-on / synthesis |
| 10 | **(Optional, if time allows) Visual frontend.** A minimal Ember Hollow page using the Storyblok JS SDK, one component per block (`game`, `external_link`), with the Storyblok Bridge so Visual Editor click-to-edit works. Check the current docs on local preview requirements first | Hands-on |
| 10.5 | **Migrations and publish states, revisited (Jay's request).** (1) The two-slot model (draft, live) and the four story states as flags (never published, live + clean, live + pending edits, taken offline); (2) predict every `--publish` mode × state, then compare with Friday's results; (3) test the untested cells (taken-offline stories; "skipped = not published"); (4) a playbook for a real migration on hundreds of stories | Hands-on |
| 11 | **Storyblok as the source of your RAG service (replaces "real webhooks", 2026-10-12).** Integrate the HW&T games into Jay's existing Python RAG (`Production_Workshop`: FastAPI `/query`, MiniLM embeddings, JSON vector store, semantic question cache with RAGAS gate). (1) Map the seams: source, chunking (150-char chunks vs one story = one chunk), IDs, citations; (2) ingest published games from the CDA with the Public token; (3) keep the semantic cache honest when content changes (re-ingest → invalidate cached answers that cite changed stories). No webhooks | Hands-on |
| 9 | **Interview synthesis (done last, after the optional modules).** DevRel lens: spotting developer friction, teaching it, mock questions in Tamas's style | Discussion |

## Reference notes (checked 2026-10-07)

- **Storyblok MCP server:** a hosted, stateless HTTP endpoint (`https://mcp.storyblok.com/mcp`). It exposes the **Management API only**, so it can't read published content through the Content Delivery API. An LLM mediates every call. The docs recommend the **CLI** for deterministic work: CI/CD and large-scale changes.
- **AI Suite:** AI Translations, AI SEO, AI Alt Text, AI Branding, Custom AI Tokens & Models (bring your own AI; Elite plan), and the Otterly.AI partnership for AI-search monitoring.
- **Public roadmap:** OpenRouter as an LLM gateway (expanding bring-your-own AI), and a built-in AI Assistant agent.
- **Tamas Piros:** previously Director of Developer Advocacy at Cloudinary. His current speaker profile focuses on AI fluency for teams.

Sources: storyblok.com/docs/tooling/mcp-server · storyblok.com/lp/ai-suite · storyblok.com/roadmap · cloudinary.com/blog/employee-spotlight-tamas-piros · sessionize.com/tpiros
