const videos = [
  'iGHaiZDs7Jw',
  'DwhE0rq171Y',
  'J515fKeNZ_A',
  'oQFperf2qj8',
  'XlfVKO12UlM'
];

async function checkYouTube() {
  for (const id of videos) {
    const oembedUrl = 'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + id + '&format=json';
    try {
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        console.log('Video ' + id + ': OK - Title: [' + data.title + '] Author: [' + data.author_name + ']');
      } else {
        console.log('Video ' + id + ': FAILED with status ' + res.status);
      }
    } catch(err) {
      console.log('Video ' + id + ': ERROR - ' + err.message);
    }
  }
}
checkYouTube();
