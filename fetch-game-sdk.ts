import { createApiClient } from "@storyblok/api-client";
import type { ISbStoryData } from "@storyblok/js";
import type { Game, Genre, Studio, Person, Platform } from "./.storyblok/types/295731578815776/storyblok-components.d.ts";

const client = createApiClient({
    accessToken: process.env.STORYBLOK_TOKEN!,
    region: "eu",
    inlineRelations: true
});

async function fetch_game(): Promise<any>{

    const { data, error } = await client.stories.get("games/ember-hollow", {
        query: {
            version: "published",
            resolve_relations: "game.genre,game.studio,game.hwt_producer,external_link.platform"
        }
    });
    if (error) throw error;

    console.log(data?.story.content);
    return(data);
}

function refName(data: ISbStoryData<Genre | Studio | Person | Platform> | string | undefined): string {
    if (typeof(data) === `string` || data === undefined)
        return 'Unknown';
    return data.content?.name ?? 'Unknown';
}

function toSummary(data: { story: ISbStoryData<Game> }): string {
    let summary = ``;

    summary = summary.concat(data.story.name + `\nGenre: ` + refName(data.story.content.genre?.[0]));

    let studios = data.story.content.studio?.map((e) => { return refName(e)});
    let studiosJoin = studios?.join(', ') ?? 'None';
    summary = summary.concat(`\nStudio(s): ` + studiosJoin);

    let producers = data.story.content.hwt_producer?.map((e) => { return refName(e)});
    let producersJoin = producers?.join(', ') ?? 'None';
    summary = summary.concat(`\nProducer(s): ` + producersJoin);
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
    summary = summary.concat('\nLinks : ' + socialMediaLinks?.map((platform: string, index: number) => {
        let url = data.story.content?.social_media?.[index]?.url?.url ?? 'Unknown';
        return platform + ' – ' + url;
    }).join(', '));
    
    let stores = data.story.content.store?.map((e) => {
        const name = refName(e.platform?.[0]);
        return name + ' – ' + (e.url?.url ?? 'Unknown');
    }).join(', ');
    summary = summary.concat('\nStores: ' + stores + '\nDescription: ' + data.story.content.description + '\n');
    console.log(summary);
    return summary;
}

let gameData = fetch_game()
    .then(data => {
    console.log('Home data fetched successfully:', data);
    let summary = toSummary(data);
    console.log('Summary:', summary);
    return summary;
    })
    .catch(error => {console.error('Error fetching home data:', error);});