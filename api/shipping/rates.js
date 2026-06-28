import { ShiprocketService } from './_shiprocket.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const {
    delivery_postcode,
    pickup_postcode,
    weight,
    cod = false,
    length,
    width,
    height,
  } = req.body;

  // Basic validation
  if (!delivery_postcode) {
    return res.status(400).json({ error: 'delivery_postcode is required' });
  }

  if (!weight || parseFloat(weight) <= 0) {
    return res.status(400).json({ error: 'weight is required and must be a positive number in kg' });
  }

  try {
    const service = new ShiprocketService();
    const result = await service.getRates({
      delivery_postcode: parseInt(delivery_postcode, 10),
      pickup_postcode: pickup_postcode ? parseInt(pickup_postcode, 10) : undefined,
      weight: parseFloat(weight),
      cod: !!cod,
      length: length ? parseInt(length, 10) : undefined,
      width: width ? parseInt(width, 10) : undefined,
      height: height ? parseInt(height, 10) : undefined,
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || 'No serviceable couriers found for this route.',
        rates: [],
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Rates API Error:', error);
    // Graceful error responses for external downtime
    const message = error.message.includes('API error')
      ? 'Courier service provider is temporarily unreachable. Please try again later.'
      : error.message;

    return res.status(500).json({
      success: false,
      error: message || 'Internal Server Error while fetching shipping rates',
    });
  }
}
