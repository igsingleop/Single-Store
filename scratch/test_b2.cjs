const fs = require('fs');
const path = require('path');

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
const bucketName = env.B2_BUCKET_NAME;

async function run() {
  try {
    const basicAuthToken = Buffer.from(`${keyId}:${applicationKey}`).toString('base64');
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: {
        'Authorization': `Basic ${basicAuthToken}`
      }
    });
    const authData = await authRes.json();
    const { downloadUrl, authorizationToken } = authData;

    // We uploaded a file earlier: posters/test_file_slash_...
    // Let's list files to get a valid filename
    const listRes = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_file_names`, {
      method: 'POST',
      headers: {
        'Authorization': authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: env.B2_BUCKET_ID,
        maxFileCount: 5
      })
    });
    const listData = await listRes.json();
    console.log('Files list:', listData);

    if (listData.files && listData.files.length > 0) {
      const fileName = listData.files[0].fileName;
      console.log('Attempting to download private file:', fileName);

      const downloadRes = await fetch(`${downloadUrl}/file/${bucketName}/${fileName}`, {
        headers: {
          'Authorization': authorizationToken
        }
      });
      console.log('Download status with authorization header:', downloadRes.status);
      if (downloadRes.ok) {
        console.log('File content read successfully!');
      }
    }

  } catch (err) {
    console.error(err);
  }
}

run();
