async function fetch_producer_games(slug: string): Promise<any>{
    const token = process.env.STORYBLOK_TOKEN;
    if (!token) {
        throw new Error('STORYBLOK_TOKEN environment variable is not set.');
    }
    const producer_url = `https://api.storyblok.com/v2/cdn/stories/person/${slug}?token=${token}&version=published`;
    let response = await fetch(producer_url, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`HTTP error fetching producer data! status: ${response.status}`);
    }
    console.log('Producer Response status:', response.status);
    let data = await response.json();
    const uuid = data.story.uuid;
    const game_url = `https://api.storyblok.com/v2/cdn/stories?content_type=game&filter_query[hwt_producer][any_in_array]=${uuid}&token=${token}&version=published`;
    response = await fetch(game_url, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`HTTP error fetching game data! status: ${response.status}`);
    }
    console.log('Game Response status:', response.status);
    data = await response.json();
    // console.log(data);
    return data;
}


let gameData = fetch_producer_games('john-doe')
    .then(data => {
    console.log('Home data fetched successfully:', data);
    let gamesNames = data.stories.map((game: any) => game.name);
    console.log('Games Names:', gamesNames);
})
    .catch(error => {console.error('Error fetching home data:', error);});
