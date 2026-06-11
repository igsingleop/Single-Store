import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import Razorpay from 'razorpay'
import crypto from 'crypto'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'api-routes',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            
            if (url.pathname === '/api/create-order' && req.method === 'POST') {
              try {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                await new Promise(resolve => req.on('end', resolve));
                const parsedBody = body ? JSON.parse(body) : {};

                const { amount, currency, receipt } = parsedBody;
                if (!amount || amount < 100) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Amount is required and must be at least 100 paise' }));
                  return;
                }

                const key_id = env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID;
                const key_secret = env.RAZORPAY_KEY_SECRET;

                if (!key_id || !key_secret) {
                  res.writeHead(401, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Razorpay API keys are not configured' }));
                  return;
                }

                const razorpay = new Razorpay({
                  key_id,
                  key_secret,
                });

                const order = await razorpay.orders.create({
                  amount: Math.round(amount),
                  currency: currency || 'INR',
                  receipt: receipt || `receipt_${Date.now()}`,
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  order_id: order.id,
                  amount: order.amount,
                  currency: order.currency,
                }));
              } catch (error) {
                console.error('Vite Dev API error (create-order):', error);
                const statusCode = error.statusCode || 500;
                res.writeHead(statusCode === 401 ? 401 : 500, { 'Content-Type': 'application/json' });
                const errorMessage = error.error?.description || error.message || 'Internal Server Error';
                res.end(JSON.stringify({ error: errorMessage }));
              }
              return;
            }

            if (url.pathname === '/api/verify-payment' && req.method === 'POST') {
              try {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                await new Promise(resolve => req.on('end', resolve));
                const parsedBody = body ? JSON.parse(body) : {};

                const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsedBody;

                if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Missing required fields for signature verification' }));
                  return;
                }

                const key_secret = env.RAZORPAY_KEY_SECRET;
                if (!key_secret) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Razorpay API secret is not configured' }));
                  return;
                }

                const generated_signature = crypto
                  .createHmac('sha256', key_secret)
                  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                  .digest('hex');

                if (generated_signature === razorpay_signature) {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, message: 'Payment verified successfully' }));
                } else {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: 'Signature mismatch' }));
                }
              } catch (error) {
                console.error('Vite Dev API error (verify-payment):', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
              }
              return;
            }

            if (url.pathname === '/api/upload' && req.method === 'POST') {
              try {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                await new Promise(resolve => req.on('end', resolve));
                const parsedBody = body ? JSON.parse(body) : {};

                const { image, filename } = parsedBody;

                if (!image) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Missing image payload' }));
                  return;
                }

                const keyId = env.B2_APPLICATION_KEY_ID;
                const applicationKey = env.B2_APPLICATION_KEY;
                const bucketId = env.B2_BUCKET_ID;
                const bucketName = env.B2_BUCKET_NAME;

                if (!keyId || !applicationKey || !bucketId || !bucketName) {
                  res.writeHead(401, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Backblaze B2 cloud storage is not configured on the local server. Please check your .env file.' }));
                  return;
                }

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
                const { apiUrl, authorizationToken, downloadUrl } = authData;

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

                // Upload
                const uploadRes = await fetch(uploadUrl, {
                  method: 'POST',
                  headers: {
                    'Authorization': uploadAuthToken,
                    'X-Bz-File-Name': encodeURIComponent(finalFilename),
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
                const publicUrl = `${downloadUrl}/file/${bucketName}/${finalFilename}`;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  url: publicUrl,
                  fileName: uploadResult.fileName,
                  fileId: uploadResult.fileId
                }));
              } catch (error) {
                console.error('Vite Dev API error (upload):', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
              }
              return;
            }

            if (url.pathname === '/api/check-env' && req.method === 'GET') {
              const key_id = env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID || '';
              const key_secret = env.RAZORPAY_KEY_SECRET || '';
              const vite_key_id = env.VITE_RAZORPAY_KEY_ID || '';
              const mask = (str) => {
                if (!str) return 'NOT_SET';
                if (str.length <= 8) return 'SET_BUT_TOO_SHORT';
                return `${str.substring(0, 8)}...${str.substring(str.length - 4)}`;
              };
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                RAZORPAY_KEY_ID: mask(key_id),
                VITE_RAZORPAY_KEY_ID: mask(vite_key_id),
                RAZORPAY_KEY_SECRET: mask(key_secret),
                match: (key_id === vite_key_id) ? 'YES' : 'NO'
              }));
              return;
            }

            next();
          });
        }
      }
    ]
  }
})
