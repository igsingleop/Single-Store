/**
 * ShiprocketService
 * A modular and production-ready service class to interact with the Shiprocket API.
 * Handles token generation, caching, rate calculations, order booking, label generation, and shipment tracking.
 */

// Module-level cache for token persistence across serverless warm starts
let cachedToken = null;
let tokenExpiry = 0; // Epoch time in ms

export class ShiprocketService {
  constructor() {
    this.email = process.env.SHIPROCKET_EMAIL;
    this.password = process.env.SHIPROCKET_PASSWORD;
    this.defaultPickupPostcode = parseInt(process.env.SHIPROCKET_DEFAULT_PICKUP_POSTCODE || '110001', 10);
    this.baseUrl = 'https://apiv2.shiprocket.in';

    if (!this.email || !this.password) {
      console.warn('Shiprocket API credentials are not set in the environment variables.');
    }
  }

  /**
   * Generates or retrieves a cached JWT token from Shiprocket.
   * Shiprocket tokens are valid for 10 days (240 hours). We cache it for 9 days.
   */
  async getAuthToken() {
    const bufferTime = 12 * 60 * 60 * 1000; // 12 hours buffer
    if (cachedToken && Date.now() < (tokenExpiry - bufferTime)) {
      return cachedToken;
    }

    if (!this.email || !this.password) {
      throw new Error('Shiprocket authentication failed: Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD');
    }

    try {
      console.log('Fetching new JWT token from Shiprocket...');
      const response = await fetch(`${this.baseUrl}/v1/external/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Authentication failed with status ${response.status}`);
      }

      if (!data.token) {
        throw new Error('No auth token returned in the Shiprocket response');
      }

      cachedToken = data.token;
      // Expire token in 9 days (Shiprocket tokens expire in 10 days)
      tokenExpiry = Date.now() + (9 * 24 * 60 * 60 * 1000);
      return cachedToken;
    } catch (error) {
      console.error('Shiprocket Login Error:', error);
      throw new Error(`Shiprocket Auth Error: ${error.message}`);
    }
  }

  /**
   * Common helper to make authenticated requests to Shiprocket API
   */
  async makeRequest(endpoint, options = {}) {
    const token = await this.getAuthToken();
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || JSON.stringify(data.errors || data) || 'Unknown Shiprocket API Error';
        throw new Error(`Shiprocket API error (${response.status}): ${errorMsg}`);
      }

      return data;
    } catch (error) {
      console.error(`Error requesting Shiprocket endpoint ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Fetches the available courier partners and rates based on delivery postcode, weight, and COD.
   * @param {Object} params
   * @param {number} params.delivery_postcode - Destination pincode
   * @param {number} [params.pickup_postcode] - Source pincode (defaults to defaultPickupPostcode)
   * @param {number} params.weight - Package weight in kilograms (e.g. 0.5)
   * @param {boolean} [params.cod=false] - Cash on delivery indicator
   * @param {number} [params.length] - Package length in cm (optional)
   * @param {number} [params.width] - Package width/breadth in cm (optional)
   * @param {number} [params.height] - Package height in cm (optional)
   */
  async getRates({
    delivery_postcode,
    pickup_postcode,
    weight,
    cod = false,
    length,
    width,
    height,
  }) {
    if (!delivery_postcode) {
      throw new Error('delivery_postcode is a required parameter.');
    }
    if (!weight || weight <= 0) {
      throw new Error('weight must be a positive number in kg.');
    }

    const pickup = pickup_postcode || this.defaultPickupPostcode;
    const codVal = cod ? 1 : 0;

    let queryParams = `pickup_postcode=${pickup}&delivery_postcode=${delivery_postcode}&weight=${weight}&cod=${codVal}`;
    if (length) queryParams += `&length=${length}`;
    if (width) queryParams += `&width=${width}`;
    if (height) queryParams += `&height=${height}`;

    const endpoint = `/v1/external/courier/serviceability/?${queryParams}`;
    const result = await this.makeRequest(endpoint, { method: 'GET' });

    if (!result.status || result.status !== 200 || !result.data || !result.data.available_courier_companies) {
      return {
        success: false,
        message: result.message || 'No serviceable couriers found for the given pincodes.',
        rates: [],
      };
    }

    // Map and clean up the couriers list
    const rates = result.data.available_courier_companies
      .map(company => ({
        courier_id: company.courier_company_id,
        courier_name: company.courier_name,
        rate: parseFloat(company.rate),
        etd: company.etd || null,
        estimated_days: company.estimated_delivery_days ? parseInt(company.estimated_delivery_days, 10) : null,
        min_weight: parseFloat(company.min_weight || '0.5'),
        rating: parseFloat(company.rating || '0'),
      }))
      // Sort: cheapest first, followed by best ratings
      .sort((a, b) => a.rate - b.rate || b.rating - a.rating);

    return {
      success: true,
      rates,
    };
  }

  /**
   * Creates an order (draft/adhoc) in Shiprocket.
   * @param {Object} orderDetails - Complete details to create the order
   */
  async createOrder(orderDetails) {
    const endpoint = '/v1/external/orders/create/adhoc';
    const result = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(orderDetails),
    });

    if (!result || !result.order_id || !result.shipment_id) {
      throw new Error('Failed to create order in Shiprocket: Invalid response payload');
    }

    return {
      shiprocket_order_id: result.order_id,
      shipment_id: result.shipment_id,
      status: result.status,
    };
  }

  /**
   * Assigns an AWB (Air Waybill) tracking number to a shipment.
   * @param {number} shipmentId - The Shiprocket shipment ID
   * @param {number} [courierId] - Optional courier partner ID to bind
   */
  async assignAwb(shipmentId, courierId) {
    const endpoint = '/v1/external/courier/assign/awb';
    const payload = {
      shipment_id: shipmentId,
    };
    if (courierId) {
      payload.courier_id = courierId;
    }

    const result = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!result || !result.response || !result.response.data || !result.response.data.awb_code) {
      throw new Error(`AWB Assignment Failed: ${result.message || 'No AWB returned'}`);
    }

    return {
      awb_code: result.response.data.awb_code,
      courier_name: result.response.data.courier_name,
      courier_company_id: result.response.data.courier_company_id,
    };
  }

  /**
   * Generates a printable shipping label for the shipment.
   * @param {number} shipmentId - The Shiprocket shipment ID
   */
  async generateLabel(shipmentId) {
    const endpoint = '/v1/external/courier/generate/label';
    const result = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        shipment_id: [shipmentId],
      }),
    });

    if (!result || !result.label_url) {
      throw new Error(`Label Generation Failed: ${result.message || 'No label URL returned'}`);
    }

    return {
      label_url: result.label_url,
    };
  }

  /**
   * Fetches latest tracking status updates using the AWB/tracking ID.
   * @param {string} awbCode - The tracking number (AWB)
   */
  async trackShipment(awbCode) {
    if (!awbCode) {
      throw new Error('tracking ID (awbCode) is required to track a shipment.');
    }

    const endpoint = `/v1/external/courier/track/awb/${awbCode}`;
    const result = await this.makeRequest(endpoint, { method: 'GET' });

    if (!result || !result.tracking_data || !result.tracking_data.shipment_track) {
      throw new Error(`Tracking query failed for ${awbCode}: Invalid response`);
    }

    const { shipment_track, shipment_track_activities } = result.tracking_data;
    const info = shipment_track[0] || {};

    const activities = (shipment_track_activities || []).map(act => ({
      date: act.date,
      activity: act.activity,
      location: act.location,
      status: act['sr-status-label'] || act.status,
    }));

    return {
      success: true,
      tracking_number: awbCode,
      status: info.current_status || 'Unknown',
      courier_name: info.courier_name || 'Shiprocket Partner',
      estimated_delivery_date: info.edd || result.tracking_data.etd || null,
      origin: info.origin || null,
      destination: info.destination || null,
      pod_url: info.pod_status || null,
      activities,
    };
  }
}
