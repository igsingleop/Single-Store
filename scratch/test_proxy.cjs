async function run() {
  try {
    const dummyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const payload = {
      image: 'data:image/png;base64,' + dummyBase64,
      filename: 'integration_test_image.png'
    };

    console.log('1. Uploading dummy image to local API server...');
    const uploadRes = await fetch('http://localhost:5173/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Upload status:', uploadRes.status);
    const uploadData = await uploadRes.json();
    console.log('Upload response:', JSON.stringify(uploadData, null, 2));

    if (!uploadData.success || !uploadData.url) {
      throw new Error('Upload failed or did not return public url');
    }

    const proxyUrl = 'http://localhost:5173' + uploadData.url;
    console.log('\n2. Fetching image through local proxy:', proxyUrl);

    const proxyRes = await fetch(proxyUrl);
    console.log('Proxy download status:', proxyRes.status);
    console.log('Proxy response headers:', JSON.stringify(Object.fromEntries(proxyRes.headers.entries()), null, 2));

    if (proxyRes.ok) {
      console.log('Success! Image size fetched via proxy:', proxyRes.headers.get('content-length'), 'bytes');
    } else {
      console.log('Failed to fetch from proxy:', await proxyRes.text());
    }

  } catch (err) {
    console.error('Error during integration test:', err);
  }
}

run();
