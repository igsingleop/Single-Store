const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const keyId = env.B2_APPLICATION_KEY_ID;
const applicationKey = env.B2_APPLICATION_KEY;
const bucketId = env.B2_BUCKET_ID;
const bucketName = env.B2_BUCKET_NAME;

console.log('B2 Configs:', { keyId, bucketId, bucketName });

async function run() {
  try {
    // 1. Authorize
    const basicAuthToken = Buffer.from(`${keyId}:${applicationKey}`).toString('base64');
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: {
        'Authorization': `Basic ${basicAuthToken}`
      }
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      throw new Error(`B2 Authorization failed: ${errText}`);
    }

    const authData = await authRes.json();
    const { apiUrl, authorizationToken, downloadUrl } = authData;
    console.log('Authorized successfully!');
    console.log('Download URL:', downloadUrl);

    // 2. Get Upload URL
    const uploadUrlRes = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: {
        'Authorization': authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bucketId })
    });

    if (!uploadUrlRes.ok) {
      const errText = await uploadUrlRes.text();
      throw new Error(`B2 Get Upload URL failed: ${errText}`);
    }

    const uploadUrlData = await uploadUrlRes.json();
    const { uploadUrl, authorizationToken: uploadAuthToken } = uploadUrlData;
    console.log('Got upload URL successfully!');

    // 3. Upload a test buffer
    const fileBuffer = Buffer.from('hello world from test script');
    const finalFilename = `posters/test_file_${Date.now()}.txt`;
    const encodedFilename = encodeURIComponent(finalFilename);
    const slashPreservingFilename = finalFilename.split('/').map(encodeURIComponent).join('/');

    console.log('Uploading with original code encoding:', encodedFilename);

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': uploadAuthToken,
        'X-Bz-File-Name': encodedFilename,
        'Content-Type': 'text/plain',
        'Content-Length': fileBuffer.length.toString(),
        'X-Bz-Content-Sha1': 'do_not_verify'
      },
      body: fileBuffer
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`B2 Upload failed: ${errText}`);
    }

    const uploadResult = await uploadRes.json();
    console.log('Upload Result:', uploadResult);

    const publicUrlOriginal = `${downloadUrl}/file/${bucketName}/${finalFilename}`;
    const publicUrlActual = `${downloadUrl}/file/${bucketName}/${encodedFilename}`;

    console.log('Checking accessibility of public friendly URL (slashes as slashes):', publicUrlOriginal);
    const testResOriginal = await fetch(publicUrlOriginal);
    console.log('Original friendly URL status:', testResOriginal.status);
    if (testResOriginal.ok) {
      console.log('Original friendly URL content:', await testResOriginal.text());
    }

    console.log('Checking accessibility of URL (percent encoded slash):', publicUrlActual);
    const testResActual = await fetch(publicUrlActual);
    console.log('Actual URL status:', testResActual.status);
    if (testResActual.ok) {
      console.log('Actual URL content:', await testResActual.text());
    }

    // Now upload with slash-preserving filename
    console.log('\n--- Now uploading with slash-preserving filename ---');
    const finalFilename2 = `posters/test_file_slash_${Date.now()}.txt`;
    const slashPreservingFilename2 = finalFilename2.split('/').map(encodeURIComponent).join('/');
    console.log('Uploading with slash preserving:', slashPreservingFilename2);

    const uploadRes2 = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': uploadAuthToken,
        'X-Bz-File-Name': slashPreservingFilename2,
        'Content-Type': 'text/plain',
        'Content-Length': fileBuffer.length.toString(),
        'X-Bz-Content-Sha1': 'do_not_verify'
      },
      body: fileBuffer
    });

    if (!uploadRes2.ok) {
      const errText = await uploadRes2.text();
      throw new Error(`B2 Upload 2 failed: ${errText}`);
    }

    const uploadResult2 = await uploadRes2.json();
    console.log('Upload 2 Result:', uploadResult2);

    const publicUrl2 = `${downloadUrl}/file/${bucketName}/${finalFilename2}`;
    console.log('Checking accessibility of public friendly URL 2:', publicUrl2);
    const testRes2 = await fetch(publicUrl2);
    console.log('Friendly URL 2 status:', testRes2.status);
    if (testRes2.ok) {
      console.log('Friendly URL 2 content:', await testRes2.text());
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
