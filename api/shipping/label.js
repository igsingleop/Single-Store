import { ShiprocketService } from './_shiprocket.js';

/**
 * Utility to format Date to Shiprocket-required format: "YYYY-MM-DD HH:mm"
 */
function formatShiprocketDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const {
    order_id,
    courier_id,
    customer_name,
    customer_email,
    customer_phone,
    delivery_postcode,
    address,
    city,
    state,
    country = 'India',
    weight,
    total_amount,
    payment_method = 'Prepaid',
    items = [],
    length = 10,
    breadth = 10,
    height = 10,
  } = req.body;

  // Crucial Validations
  if (!order_id) return res.status(400).json({ error: 'order_id is required' });
  if (!courier_id) return res.status(400).json({ error: 'courier_id is required' });
  if (!customer_name) return res.status(400).json({ error: 'customer_name is required' });
  if (!customer_phone) return res.status(400).json({ error: 'customer_phone is required' });
  if (!delivery_postcode) return res.status(400).json({ error: 'delivery_postcode is required' });
  if (!address) return res.status(400).json({ error: 'address is required' });
  if (!city) return res.status(400).json({ error: 'city is required' });
  if (!state) return res.status(400).json({ error: 'state is required' });
  if (!weight || parseFloat(weight) <= 0) {
    return res.status(400).json({ error: 'weight is required and must be a positive number in kg' });
  }
  if (!total_amount) return res.status(400).json({ error: 'total_amount is required' });
  if (items.length === 0) return res.status(400).json({ error: 'items list cannot be empty' });

  try {
    const service = new ShiprocketService();

    // 1. Structure order items according to Shiprocket spec
    const orderItems = items.map((item, idx) => ({
      name: item.name || item.title || `Item ${idx + 1}`,
      sku: item.sku || item.id || `SKU-${idx + 1}`,
      units: parseInt(item.quantity || 1, 10),
      selling_price: String(item.price),
      discount: String(item.discount || 0),
      tax: String(item.tax || 0),
      hsn: item.hsn || '',
    }));

    // Split customer name into first and last name (Shiprocket requires both or defaults)
    const nameParts = customer_name.trim().split(/\s+/);
    const billingFirstName = nameParts[0] || 'Customer';
    const billingLastName = nameParts.slice(1).join(' ') || '.';

    // Build the Shiprocket Adhoc Order Payload
    const shiprocketOrderPayload = {
      order_id: String(order_id),
      order_date: formatShiprocketDate(new Date()),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION_NAME || 'Primary',
      channel_id: '',
      comment: 'Ecommerce Automated Fulfillment',
      billing_customer_name: billingFirstName,
      billing_last_name: billingLastName,
      billing_address: address,
      billing_address_2: '',
      billing_city: city,
      billing_pincode: String(delivery_postcode),
      billing_state: state,
      billing_country: country,
      billing_email: customer_email || 'sales@singlestore.in',
      billing_phone: String(customer_phone),
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: payment_method === 'COD' ? 'COD' : 'Prepaid',
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: parseFloat(total_amount),
      length: parseInt(length, 10),
      breadth: parseInt(breadth, 10),
      height: parseInt(height, 10),
      weight: parseFloat(weight),
    };

    console.log(`Step 1: Creating order on Shiprocket for Order ID: ${order_id}...`);
    const orderResult = await service.createOrder(shiprocketOrderPayload);
    const { shipment_id, shiprocket_order_id } = orderResult;

    console.log(`Step 2: Assigning AWB/tracking ID using courier ID: ${courier_id} for shipment: ${shipment_id}...`);
    const awbResult = await service.assignAwb(shipment_id, parseInt(courier_id, 10));
    const { awb_code, courier_name } = awbResult;

    console.log(`Step 3: Generating label for shipment ID: ${shipment_id}...`);
    const labelResult = await service.generateLabel(shipment_id);
    const { label_url } = labelResult;

    // Optional: Database Mapping Hooks
    // At this stage, you would typically write these details (tracking number, shipment ID, label URL, status)
    // back to your database (e.g., Firestore orders collection).
    //
    // Example DB Hook (commented out for lightweight, decoupled utility):
    // await updateDoc(doc(firestoreDb, 'orders', order_id), {
    //   shipmentId: shipment_id,
    //   shiprocketOrderId: shiprocket_order_id,
    //   trackingId: awb_code,
    //   courierName: courier_name,
    //   labelUrl: label_url,
    //   status: 'Shipped'
    // });

    return res.status(200).json({
      success: true,
      order_id,
      shipment_id,
      shiprocket_order_id,
      tracking_number: awb_code,
      courier_name,
      label_url,
    });
  } catch (error) {
    console.error('Label API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error while generating shipping label',
    });
  }
}
