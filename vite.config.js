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

            next();
          });
        }
      }
    ]
  }
})
