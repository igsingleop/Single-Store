// Deterministic helper to generate unique IDs if missing from older orders
export function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export function getOrderShippingId(order) {
  if (order.shippingId) return order.shippingId;
  const num = Math.abs(hashCode(order.id + "-shipping")) % 100000000;
  return `SS-SHIP-${num.toString().padStart(8, '0')}`;
}

export function getOrderTrackingId(order) {
  if (order.trackingId) return order.trackingId;
  const num = Math.abs(hashCode(order.id + "-tracking")) % 100000000;
  return `SS-TRK-${num.toString().padStart(8, '0')}`;
}

export function getOrderPhone(order, user) {
  return order.customerPhone || (user && user.phoneNumber) || '9876543210';
}

export function getOrderAddress(order) {
  return order.shippingAddress || 'Not Provided, India';
}

// Function to dynamically load html2pdf script
const loadHtml2Pdf = () => {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) {
      resolve(window.html2pdf);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => reject(new Error('Failed to load html2pdf.js library'));
    document.body.appendChild(script);
  });
};

export async function downloadInvoicePDF(order, userDetails = null) {
  try {
    const html2pdf = await loadHtml2Pdf();
    
    // Create element for PDF generation
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    element.style.color = '#1f2937';
    element.style.backgroundColor = '#ffffff';
    
    const shippingId = getOrderShippingId(order);
    const trackingId = getOrderTrackingId(order);
    const address = getOrderAddress(order);
    const phone = getOrderPhone(order, userDetails);
    
    const itemsRows = order.items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; text-align: left; font-size: 13px; font-weight: 500; color: #111827;">
          ${idx + 1}
        </td>
        <td style="padding: 12px 8px; text-align: left; font-size: 13px; color: #374151;">
          <div style="font-weight: 600; color: #111827;">${item.title}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Size: ${item.size} | Frame: ${item.frame}</div>
        </td>
        <td style="padding: 12px 8px; text-align: center; font-size: 13px; color: #374151;">
          ${item.quantity || 1}
        </td>
        <td style="padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 500; color: #374151; font-family: monospace;">
          Rs. ${parseFloat(item.price).toFixed(2)}
        </td>
        <td style="padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 700; color: #111827; font-family: monospace;">
          Rs. ${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const subtotal = order.items.reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0);
    const discount = subtotal - parseFloat(order.total);
    const hasDiscount = discount > 0.01;

    // SVG signature of the company authorization
    const companySignatureSVG = `
      <svg width="140" height="50" viewBox="0 0 140 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M 15 35 Q 35 5 55 30 T 95 15 T 125 35" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
        <path d="M 45 40 L 115 10" fill="none" stroke="#2563eb" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
        <text x="25" y="47" font-family="'Courier New', Courier, monospace" font-size="9" fill="#4b5563" font-weight="bold">Authorized Signatory</text>
      </svg>
    `;

    // SVG logo
    const logoSVG = `
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="8" fill="url(#paint0_linear)"/>
        <path d="M10 24V12L15 15L20 12V24" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <defs>
          <linearGradient id="paint0_linear" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stop-color="#2563EB"/>
            <stop offset="1" stop-color="#4F46E5"/>
          </linearGradient>
        </defs>
      </svg>
    `;

    element.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <div style="padding: 30px; border-bottom: 2px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${logoSVG}
            <div>
              <span style="font-size: 20px; font-weight: 850; letter-spacing: -0.5px; background: linear-gradient(to right, #2563eb, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Single Store</span>
              <div style="font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Premium Art Outlets</div>
            </div>
          </div>
          <div style="text-align: right;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">TAX INVOICE</h1>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280; font-weight: 500;">Invoice Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <!-- Meta Details -->
        <div style="padding: 24px 30px; background-color: #fafafa; border-bottom: 1px solid #f3f4f6; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <!-- Left: Order Details -->
          <div>
            <h3 style="margin: 0 0 10px 0; font-size: 11px; color: #9ca3af; font-weight: 750; text-transform: uppercase; letter-spacing: 1px;">Order Details</h3>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-weight: 500; width: 100px;">Order ID:</td>
                <td style="padding: 4px 0; color: #111827; font-weight: 700; font-family: monospace;">#${order.id}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-weight: 500;">Order Date:</td>
                <td style="padding: 4px 0; color: #111827; font-weight: 600;">${new Date(order.date).toLocaleDateString()} at ${new Date(order.date).toLocaleTimeString()}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-weight: 500;">Payment status:</td>
                <td style="padding: 4px 0; color: #10b981; font-weight: 750; text-transform: uppercase; font-size: 11px;">
                  Paid (${order.id.startsWith('mock_pay_') ? 'Simulated Card' : 'Razorpay'})
                </td>
              </tr>
            </table>
          </div>

          <!-- Right: Shipping & Tracking Details -->
          <div>
            <h3 style="margin: 0 0 10px 0; font-size: 11px; color: #9ca3af; font-weight: 750; text-transform: uppercase; letter-spacing: 1px;">Shipping & Tracking</h3>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-weight: 500; width: 100px;">Shipping ID:</td>
                <td style="padding: 4px 0; color: #111827; font-weight: 600; font-family: monospace;">${shippingId}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-weight: 500;">Tracking ID:</td>
                <td style="padding: 4px 0; color: #111827; font-weight: 600; font-family: monospace;">${trackingId}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-weight: 500;">Carrier status:</td>
                <td style="padding: 4px 0; color: #2563eb; font-weight: 700; text-transform: uppercase; font-size: 11px;">
                  ${order.status || 'Placed'}
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Address details -->
        <div style="padding: 24px 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <!-- Customer Address -->
          <div>
            <h3 style="margin: 0 0 8px 0; font-size: 11px; color: #9ca3af; font-weight: 750; text-transform: uppercase; letter-spacing: 1px;">Invoiced To</h3>
            <div style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 4px;">${order.customerName}</div>
            <div style="font-size: 12px; color: #4b5563; line-height: 1.5; white-space: pre-line;">${address}</div>
            <div style="font-size: 12px; color: #4b5563; margin-top: 4px;">Email: ${order.customerEmail}</div>
            <div style="font-size: 12px; color: #4b5563;">Phone: ${phone}</div>
          </div>

          <!-- Company Details -->
          <div style="text-align: right;">
            <h3 style="margin: 0 0 8px 0; font-size: 11px; color: #9ca3af; font-weight: 750; text-transform: uppercase; letter-spacing: 1px; text-align: right;">From Store</h3>
            <div style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 4px;">Single Store Inc.</div>
            <div style="font-size: 12px; color: #4b5563; line-height: 1.5;">
              100 Premium Poster Lane,<br>
              Erode, Tamil Nadu, 638116,<br>
              India
            </div>
            <div style="font-size: 12px; color: #4b5563; margin-top: 4px;">support@thesinglestore.xyz</div>
            <div style="font-size: 12px; color: #4b5563;">GSTIN: 33AAYCS1234F1Z0</div>
          </div>
        </div>

        <!-- Invoice Items Table -->
        <div style="padding: 0 30px;">
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 8px; text-align: left; font-size: 11px; font-weight: 750; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; width: 40px;">#</th>
                <th style="padding: 8px; text-align: left; font-size: 11px; font-weight: 750; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Item & Specifications</th>
                <th style="padding: 8px; text-align: center; font-size: 11px; font-weight: 750; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; width: 60px;">Qty</th>
                <th style="padding: 8px; text-align: right; font-size: 11px; font-weight: 750; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; width: 100px;">Price</th>
                <th style="padding: 8px; text-align: right; font-size: 11px; font-weight: 750; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; width: 120px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        <!-- Totals & Payment summary -->
        <div style="padding: 24px 30px; display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px;">
          <!-- Payment Stamp info -->
          <div style="padding: 15px; border-radius: 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0; display: inline-flex; align-items: center; gap: 10px; max-w: 300px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #22c55e;"></div>
            <div>
              <div style="font-size: 11px; font-weight: 750; color: #14532d; text-transform: uppercase; tracking-wide;">PAYMENT SECURED</div>
              <div style="font-size: 10px; color: #15803d; margin-top: 2px;">Thank you for your purchase. All transactions are fully encrypted and verified.</div>
            </div>
          </div>

          <!-- Total Calculation -->
          <div style="width: 280px;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 500; text-align: left;">Subtotal</td>
                <td style="padding: 6px 0; color: #111827; font-weight: 600; text-align: right; font-family: monospace;">Rs. ${subtotal.toFixed(2)}</td>
              </tr>
              ${hasDiscount ? `
              <tr>
                <td style="padding: 6px 0; color: #10b981; font-weight: 600; text-align: left;">Coupon Discount</td>
                <td style="padding: 6px 0; color: #10b981; font-weight: 600; text-align: right; font-family: monospace;">-Rs. ${discount.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 500; text-align: left;">Shipping & Handling</td>
                <td style="padding: 6px 0; color: #10b981; font-weight: 600; text-align: right;">FREE</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 500; text-align: left;">Taxes & GST (Inclusive)</td>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 500; text-align: right;">Rs. 0.00</td>
              </tr>
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; color: #111827; font-weight: 800; text-align: left; font-size: 15px;">Grand Total</td>
                <td style="padding: 12px 0; color: #2563eb; font-weight: 800; text-align: right; font-size: 18px; font-family: monospace;">Rs. ${parseFloat(order.total).toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Footer Notes & Authorized Signature Sign -->
        <div style="padding: 24px 30px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: flex-end; background-color: #fafafa;">
          <div style="max-w: 400px;">
            <div style="font-size: 11px; font-weight: 700; color: #4b5563; margin-bottom: 4px;">Terms & Conditions</div>
            <div style="font-size: 9px; color: #9ca3af; line-height: 1.4;">
              1. Goods once sold are not returnable or exchangeable unless defective.<br>
              2. Delivery queries can be tracked using the Tracking ID shown above.<br>
              3. This is a computer-generated invoice and requires no physical signature under normal conditions.
            </div>
          </div>
          <div style="text-align: center;">
            ${companySignatureSVG}
            <div style="font-size: 9px; color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">Authorized Signature</div>
          </div>
        </div>
      </div>
    `;

    // Temporary append to DOM so html2pdf can render it correctly
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '-9999px';
    element.style.width = '800px';
    document.body.appendChild(element);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Invoice_${order.id.substring(0, 12)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2.5, 
        useCORS: true,
        logging: false,
        letterRendering: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().from(element).set(opt).save();
    
    // Clean up DOM
    document.body.removeChild(element);
  } catch (error) {
    console.error("Failed to generate and download PDF invoice:", error);
    alert("Could not download invoice PDF: " + error.message);
  }
}
