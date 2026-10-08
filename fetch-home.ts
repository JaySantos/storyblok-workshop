async function fetch_home(): Promise<any>{
    const token = process.env.STORYBLOK_TOKEN;
    if (!token) {
        throw new Error('STORYBLOK_TOKEN environment variable is not set.');
    }
    const url = `https://api.storyblok.com/v2/cdn/stories/home?token=${token}&version=draft`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log('Response status:', response.status);
    const data = await response.json();
    return data;
}

async function fetch_space(): Promise<any> {
    const token = process.env.STORYBLOK_TOKEN;
    if (!token) {
        throw new Error('STORYBLOK_TOKEN environment variable is not set.');
    }
    const url = `https://api.storyblok.com/v2/cdn/spaces/me?token=${token}`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log('Response status:', response.status);
    const data = await response.json();
    return data;
}

fetch_home().then(data => {console.log('Home data fetched successfully:', data);})
            .catch(error => {console.error('Error fetching home data:', error);});

// fetch_space().then(data => {console.log('Space data fetched successfully:', data);})
//             .catch(error => {console.error('Error fetching space data:', error);});