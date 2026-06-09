import Razorpay from 'razorpay';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { amount, currency, receipt } = req.body;

  if (!amount || amount < 100) {
    return res.status(400).json({ error: 'Amount is required and must be at least 100 paise' });
  }

  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    return res.status(401).json({ error: 'Razorpay API keys are not configured' });
  }

  try {
    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.error?.description || error.message || 'Internal Server Error';
    return res.status(statusCode === 401 ? 401 : 500).json({ error: errorMessage });
  }
}
