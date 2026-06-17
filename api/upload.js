export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { image, filename } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Missing image payload' });
  }

  const keyId = process.env.B2_APPLICATION_KEY_ID;
  const applicationKey = process.env.B2_APPLICATION_KEY;
  const bucketId = process.env.B2_BUCKET_ID;
  const bucketName = process.env.B2_BUCKET_NAME;

  if (!keyId || !applicationKey || !bucketId || !bucketName) {
    return res.status(401).json({ error: 'Backblaze B2 cloud storage is not configured on the server.' });
  }

  try {
    let base64Data = image;
    if (image.startsWith('data:')) {
      const parts = image.split(';base64,');
      if (parts.length > 1) {
        base64Data = parts[1];
      }
    }

    const fileBuffer = Buffer.from(base64Data, 'base64');
    const originalName = filename || 'upload.jpg';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalFilename = `posters/poster_${Date.now()}_${sanitizedName}`;

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
    const { apiUrl, authorizationToken } = authData;

    // Get Upload URL
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

    // Upload with slash preserving filename encoding
    const slashPreservingFilename = finalFilename.split('/').map(encodeURIComponent).join('/');

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': uploadAuthToken,
        'X-Bz-File-Name': slashPreservingFilename,
        'Content-Type': 'image/jpeg',
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
    const publicUrl = `/api/posters?filename=${encodeURIComponent(finalFilename)}`;

    return res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: uploadResult.fileName,
      fileId: uploadResult.fileId
    });
  } catch (error) {
    console.error('Error in /api/upload handler:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
