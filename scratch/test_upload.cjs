const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const dummyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const payload = {
      image: 'data:image/png;base64,' + dummyBase64,
      filename: 'test_upload_file.png'
    };

    console.log('Sending upload request to http://localhost:5173/api/upload ...');
    const res = await fetch('http://localhost:5173/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

// Wait 2 seconds for server to start before running
setTimeout(run, 2000);
