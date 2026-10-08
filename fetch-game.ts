async function fetch_game(): Promise<any>{
    const token = process.env.STORYBLOK_TOKEN;
    if (!token) {
        throw new Error('STORYBLOK_TOKEN environment variable is not set.');
    }
    const url = `https://api.storyblok.com/v2/cdn/stories/games/ember-hollow?token=${token}&version=published&resolve_relations=game.genre,game.studio,game.hwt_producer,external_link.platform`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log('Response status:', response.status);
    console.log(JSON.stringify(response, null, 2));
    const data = await response.json();
    return data;
}

function toSummary(data: any): string {
    let summary = data.story.name + '\n';
    let genre = data.rels.find(
        (element) => element.uuid === data.story.content.genre[0])?.content?.name ?? 'Unknown';
    summary = summary.concat('Genre: ' + genre + '\n');

    let studios = data.story.content.studio.map((e: any) => { return data.rels.find((element) => element.uuid === e)?.content?.name 
        ?? 'Unknown';});

    summary = summary.concat('Studio(s): ' + studios.join(', ') + '\n');

    let producers = data.story.content.hwt_producer.map((e: any) => { return data.rels.find((element) => element.uuid === e)?.content?.name 
        ?? 'Unknown';});

    summary = summary.concat('Producer(s): ' + producers.join(', ') + '\n');

    if (!data.story.content.release_year)
        summary = summary.concat('Release: TBD' + '\n');
    else
    {
        if (!data.story.content.release_quarter)
            summary = summary.concat('Release: ' + data.story.content.release_year + '\n');
        else
            summary = summary.concat('Release: ' + data.story.content.release_quarter + ' ' + data.story.content.release_year + '\n');
    }

    summary = summary.concat('Links : ');
    let socialMediaLinks = data.story.content.social_media.map((e: any) => { return data.rels.find((element) => element.uuid === e.platform[0])?.content?.name ?? 'Unknown';});

    summary = summary.concat(socialMediaLinks.map((platform: string, index: number) => {
        let url = data.story.content.social_media[index].url.url;
        return platform + ' – ' + url;
    }).join(', ') + '\n');

    let stores = data.story.content.store.map((e: any) => {
        const name = data.rels.find((element) => element.uuid === e.platform[0])?.content?.name ?? 'Unknown';
        return name + ' – ' + e.url.url;
    }).join(', ');

    summary = summary.concat('Stores: ' + stores + '\n');

    summary = summary.concat('\nDescription: ' + data.story.content.description + '\n');
    console.log('Summary:', summary);
    return summary;
}

let gameData = fetch_game().then(data => {
    console.log('Home data fetched successfully:', data);
    return toSummary(data);
})
            .catch(error => {console.error('Error fetching home data:', error);});