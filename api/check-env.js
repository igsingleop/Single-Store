export default async function handler(req, res) {
  const key_id = process.env.RAZORPAY_KEY_ID || '';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '';
  const vite_key_id = process.env.VITE_RAZORPAY_KEY_ID || '';

  const mask = (str) => {
    if (!str) return 'NOT_SET';
    if (str.length <= 8) return 'SET_BUT_TOO_SHORT';
    return `${str.substring(0, 8)}...${str.substring(str.length - 4)}`;
  };

  return res.status(200).json({
    RAZORPAY_KEY_ID: mask(key_id),
    VITE_RAZORPAY_KEY_ID: mask(vite_key_id),
    RAZORPAY_KEY_SECRET: mask(key_secret),
    match: (key_id === vite_key_id) ? 'YES' : 'NO'
  });
}
