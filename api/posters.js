export default async function handler(req, res) {
  const filename = req.query.filename;
  if (!filename) {
    return res.status(400).json({ error: 'filename query parameter is required' });
  }

  const keyId = process.env.B2_APPLICATION_KEY_ID;
  const applicationKey = process.env.B2_APPLICATION_KEY;
  const bucketName = process.env.B2_BUCKET_NAME;

  if (!keyId || !applicationKey || !bucketName) {
    return res.status(500).json({ error: 'B2 configurations are missing on the server' });
  }

  try {
    // Authorize B2
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
    const { downloadUrl, authorizationToken } = authData;

    // Fetch the file from B2
    const encodedFilename = filename.split('/').map(encodeURIComponent).join('/');
    const fileUrl = `${downloadUrl}/file/${bucketName}/${encodedFilename}`;

    const downloadRes = await fetch(fileUrl, {
      headers: {
        'Authorization': authorizationToken
      }
    });

    if (!downloadRes.ok) {
      return res.status(downloadRes.status).send(`Failed to fetch file from B2: ${downloadRes.statusText}`);
    }

    // Set headers
    const contentType = downloadRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = downloadRes.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    const arrayBuffer = await downloadRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Error fetching file from B2:', error);
    return res.status(500).json({ error: error.message });
  }
}
