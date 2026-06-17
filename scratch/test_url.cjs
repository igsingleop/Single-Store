async function run() {
  const url = 'https://f005.backblazeb2.com/file/Single-Store/posters/poster_1781722099027_test_upload_file.png';
  try {
    const res = await fetch(url);
    console.log('Status of public URL:', res.status);
    console.log('Headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
    if (res.ok) {
      console.log('Content-Length:', res.headers.get('content-length'));
    } else {
      console.log('Error content:', await res.text());
    }
  } catch (err) {
    console.error(err);
  }
}

run();
