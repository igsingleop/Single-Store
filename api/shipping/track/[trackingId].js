import { ShiprocketService } from '../_shiprocket.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Vercel serverless functions populate path parameters on req.query
  const { trackingId } = req.query;

  if (!trackingId) {
    return res.status(400).json({ error: 'trackingId parameter is required' });
  }

  try {
    const service = new ShiprocketService();
    console.log(`Tracking shipment with AWB/trackingId: ${trackingId}...`);
    const trackingInfo = await service.trackShipment(trackingId);

    return res.status(200).json(trackingInfo);
  } catch (error) {
    console.error('Tracking API Error:', error);
    // Graceful error responses for external downtime or non-existent tracking IDs
    const message = error.message.includes('API error')
      ? 'Unable to track shipment at this time. The tracking ID may be invalid or not yet active in the carrier system.'
      : error.message;

    return res.status(500).json({
      success: false,
      error: message || `Internal Server Error while tracking ${trackingId}`,
    });
  }
}
