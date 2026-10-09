import { createApiClient } from "@storyblok/api-client";
import type { ISbStoryData } from "@storyblok/js";
import type { Game, Genre, Studio, Person, Platform } from "./.storyblok/types/295731578815776/storyblok-components.d.ts";

const client = createApiClient({
    accessToken: process.env.STORYBLOK_PUBLIC_TOKEN!,
    region: "eu",
    inlineRelations: true
});

function upsertGame(index: any, story: any){
    const summary = toSummary({ story: story as ISbStoryData<Game> });
    const pos = index.findIndex((game: any) => game.id === story.id);
    if (pos === -1)
    {
        index.push({ id: story.id, full_slug: story.full_slug, published_at: story.published_at, text: summary });
    }
    else
    {
        index[pos].full_slug = story.full_slug;
        index[pos].published_at = story.published_at;
        index[pos].text = summary;
    }
}

async function handleWebhook(index: any, payload: any) {
    if (payload.action === `unpublished` || payload.action === `deleted`)
    {
        const pos = index.findIndex((game: any) => game.id === payload.story_id);
        if (pos !== -1)
        {
            index.splice(pos, 1);
        }
    }
    else if (payload.action === `moved`)
    {
        //ASSUMPTION: NEW FULL_SLUG IS INCLUDED IN THE PAYLOAD
        const pos = index.findIndex((game: any) => game.id === payload.story_id);
        if (pos !== -1)
        {
            index[pos].full_slug = payload.full_slug;
        }
    }
    else if (payload.action === `published`)
    {
        const { data, error } = await client.stories.get(payload.full_slug, {query: {
            version: "published",
            resolve_relations: "game.genre,game.studio,game.hwt_producer,external_link.platform"
        }});
        if (error) throw error;
        if (!data?.story) throw new Error(`No story for ${payload.full_slug}`);
        if (data.story.content.component === `game`)
        {
            upsertGame(index, data.story);
        }
        else if (data.story.content.component === `studio`)
        {
            const { data: games, error: gamesError } = await client.stories.list({
                query: {
                    content_type: "game",
                    version: "published",
                    filter_query: {
                        "studio": {
                            in_array: data.story.uuid
                        }
                    },
                    resolve_relations: "game.genre,game.studio,game.hwt_producer,external_link.platform"
                }
            });
            if (gamesError) throw gamesError;
            games?.stories.forEach((game: any) => {
                upsertGame(index, game);
            });
        }
    }
}

function refName(data: ISbStoryData<Genre | Studio | Person | Platform> | string | undefined): string {
    if (typeof(data) === `string` || data === undefined)
        return 'Unknown';
    return data.content?.name ?? 'Unknown';
}

function toSummary(data: { story: ISbStoryData<Game> }): string {
    let summary = ``;

    summary = summary.concat(data.story.content.name + `\nGenre: ` + refName(data.story.content.genre?.[0]));

    let studios = data.story.content.studio?.map((e) => { return refName(e)});
    let studiosJoin = studios?.join(', ') ?? 'None';
    summary = summary.concat(`\nStudio(s): ` + (studiosJoin === "" ? "None" : studiosJoin));

    let producers = data.story.content.hwt_producer?.map((e) => { return refName(e)});
    let producersJoin = producers?.join(', ') ?? 'None';
    summary = summary.concat(`\nProducer(s): ` + (producersJoin === "" ? "None" : producersJoin));
    if (!data.story.content.release_year)
        summary = summary.concat('\nRelease: TBD' + '\n');
    else
    {
        if (!data.story.content.release_quarter)
            summary = summary.concat('\nRelease: ' + data.story.content.release_year + '\n');
        else
            summary = summary.concat('\nRelease: ' + data.story.content.release_quarter + ' ' + data.story.content.release_year + '\n');
    }
    let socialMediaLinks = data.story.content.social_media?.map((e) => { return refName(e.platform?.[0])});
    let sociialMediaLinksString = socialMediaLinks?.map((platform: string, index: number) => {
        let url = data.story.content?.social_media?.[index]?.url?.url ?? 'Unknown';
        return platform + ' – ' + url;
    }).join(', ');
    summary = summary.concat('\nLinks : ' + (sociialMediaLinksString === "" ? "None" : sociialMediaLinksString));
    
    let stores = data.story.content.store?.map((e) => {
        const name = refName(e.platform?.[0]);
        return name + ' – ' + (e.url?.url ?? 'Unknown');
    }).join(', ');
    summary = summary.concat('\nStores: ' + (stores === "" ? "None" : stores) + '\nDescription: ' + data.story.content.description + '\n');
    console.log(summary);
    return summary;
}

async function build_index() {
    const { data, error } = await client.stories.list({
        query: {
            content_type: "game",
            version: "published",
            resolve_relations: "game.genre,game.studio,game.hwt_producer,external_link.platform"
        }
    });
    if (error) throw error;

    let gameSummaries = data?.stories.map((game: any) => {
    let summary = toSummary({ story: game });
    let gameSummary = {
        id: game.id,
        full_slug: game.full_slug,
        published_at: game.published_at,
        text: summary
    };
    console.log(gameSummary);
    return gameSummary;
    });
    return(gameSummaries);
}

// let gameSummaries;
let gameIndex = await build_index();

// for (const doc of gameIndex) {
//     doc.text = doc.text.replace("Fruitbot Inc.", "Fruitbot");
// }

// await handleWebhook(gameIndex, { action: "unpublished", story_id: 228394870669173, full_slug: "games/ghostless" });
// await handleWebhook(gameIndex, { action: "published", story_id: 228126713251545, full_slug: "studios/fruitbot" });
// await handleWebhook(gameIndex, { action: "moved", story_id: 228129126731137, full_slug: "archive/ember-hollow" });
console.log(gameIndex);