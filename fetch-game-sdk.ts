import { createApiClient } from "@storyblok/api-client";

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

function toSummary(data: any): string {
    let summary = ``;
    summary = summary.concat(data.story.name + `\nGenre: ` + (data.story.content.genre[0]?.content?.name ?? 'Unknown'));
    let studios = data.story.content.studio.map((e: any) => { return e?.content?.name ?? 'Unknown';});
    summary = summary.concat(`\nStudio(s): ` + studios.join(', '));
    let producers = data.story.content.hwt_producer.map((e: any) => { return e?.content?.name ?? 'Unknown';});
    summary = summary.concat(`\nProducer(s): ` + producers.join(', '));
    if (!data.story.content.release_year)
        summary = summary.concat('\nRelease: TBD' + '\n');
    else
    {
        if (!data.story.content.release_quarter)
            summary = summary.concat('\nRelease: ' + data.story.content.release_year + '\n');
        else
            summary = summary.concat('\nRelease: ' + data.story.content.release_quarter + ' ' + data.story.content.release_year + '\n');
    }
    let socialMediaLinks = data.story.content.social_media.map((e: any) => { return e.platform[0]?.content?.name ?? 'Unknown';});
    summary = summary.concat('\nLinks : ' + socialMediaLinks.map((platform: string, index: number) => {
        let url = data.story.content.social_media[index]?.url?.url ?? 'Unknown';
        return platform + ' – ' + url;
    }).join(', '));
    
    let stores = data.story.content.store.map((e: any) => {
        const name = e.platform[0]?.content?.name ?? 'Unknown';
        return name + ' – ' + (e.url?.url ?? 'Unknown');
    }).join(', ');
    summary = summary.concat('\nStores: ' + stores + '\nDescription: ' + data.story.content.description + '\n');

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