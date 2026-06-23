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

export function getOrderInvoiceId(order) {
  if (order.invoiceId) return order.invoiceId;
  const num = Math.abs(hashCode(order.id + "-invoice")) % 100000000;
  return `SS-INV-${num.toString().padStart(8, '0')}`;
}

export function getOrderPhone(order, user) {
  return order.customerPhone || (user && user.phoneNumber) || '9876543210';
}

export function getOrderAddress(order) {
  return order.shippingAddress || 'Not Provided, India';
}

const preloadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};

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

export function getPlaceOfSupply(order) {
  const address = getOrderAddress(order).toLowerCase();
  if (address.includes('tamil nadu') || address.includes('tn') || address.includes('erode') || address.includes('chennai') || address.includes('coimbatore')) {
    return 'Tamil Nadu';
  }
  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry', 'Jammu & Kashmir', 'Ladakh'
  ];
  for (const state of states) {
    if (address.includes(state.toLowerCase())) {
      return state;
    }
  }
  const parts = getOrderAddress(order).split(',');
  if (parts.length >= 3) {
    return parts[parts.length - 3].trim();
  }
  return 'Tamil Nadu';
}

export async function downloadInvoicePDF(order, userDetails = null) {
  try {
    const html2pdf = await loadHtml2Pdf();

    // Preload logo and signature images to browser cache to guarantee they are loaded before capture
    await Promise.all([
      preloadImage('/favicon.jpg'),
      preloadImage('/favicon.png'),
      preloadImage('/signature.png')
    ]);

    // Create wrapper to hide element off-screen without collapsing layout
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0px';
    wrapper.style.width = '720px';
    wrapper.style.height = 'auto';
    wrapper.style.zIndex = '-99999';
    wrapper.style.overflow = 'hidden';

    // Create element for PDF generation
    const element = document.createElement('div');
    element.style.padding = '40px';
    element.style.fontFamily = "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    element.style.color = '#1f2937';
    element.style.backgroundColor = '#ffffff';
    element.style.width = '720px';
    element.style.boxSizing = 'border-box';

    const invoiceId = getOrderInvoiceId(order);
    const address = getOrderAddress(order);
    const phone = getOrderPhone(order, userDetails);
    const placeOfSupply = getPlaceOfSupply(order);

    const orderId = order.orderId || order.razorpayOrderId || `SS-ORD-${Math.abs(hashCode(order.id || '')).toString().padStart(8, '0')}`;

    const totalPaid = parseFloat(order.total);
    const subtotalBeforeDiscount = order.items.reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0);
    const discountAmount = Math.max(0, subtotalBeforeDiscount - totalPaid);
    const hasDiscount = discountAmount > 0.01;

    // GST calculations (12% total, split into 6% SGST + 6% CGST)
    const subtotalExclusive = order.items.reduce((sum, item) => sum + (parseFloat(item.price) / 1.12) * (item.quantity || 1), 0);
    const discountExclusive = discountAmount / 1.12;
    const taxableValue = subtotalExclusive - discountExclusive;
    const sgstTotal = taxableValue * 0.06;
    const cgstTotal = taxableValue * 0.06;

    const itemsRows = order.items.map((item, idx) => {
      const qty = item.quantity || 1;
      const rateInclusive = parseFloat(item.price);
      const rateExclusive = rateInclusive / 1.12;
      const amountExclusive = rateExclusive * qty;
      const sgstAmount = amountExclusive * 0.06;
      const cgstAmount = amountExclusive * 0.06;
      const cessAmount = 0.00;

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; text-align: center; font-size: 11px; color: #374151; vertical-align: middle;">
            ${idx + 1}
          </td>
          <td style="padding: 12px 8px; text-align: left; font-size: 11px; color: #374151; vertical-align: middle;">
            <div style="font-weight: 700; color: #111827;">${item.title}</div>
            ${((item.size && item.size !== '18x24"') || (item.frame && item.frame !== 'Print Only')) ? `<div style="font-size: 9px; color: #6b7280; margin-top: 2px;">Size: ${item.size} | Frame: ${item.frame}</div>` : ''}
          </td>
          <td style="padding: 12px 8px; text-align: center; font-size: 11px; color: #374151; vertical-align: middle;">
            49111010
          </td>
          <td style="padding: 12px 8px; text-align: center; font-size: 11px; color: #374151; vertical-align: middle;">
            ${qty}
          </td>
          <td style="padding: 12px 8px; text-align: right; font-size: 11px; color: #374151; font-family: monospace; vertical-align: middle;">
            ${rateExclusive.toFixed(2)}
          </td>
          <td style="padding: 12px 8px; text-align: right; font-size: 11px; color: #374151; vertical-align: middle;">
            <div style="font-family: monospace;">${sgstAmount.toFixed(2)}</div>
            <div style="font-size: 9px; color: #6b7280; margin-top: 1px; text-align: right;">6</div>
          </td>
          <td style="padding: 12px 8px; text-align: right; font-size: 11px; color: #374151; vertical-align: middle;">
            <div style="font-family: monospace;">${cgstAmount.toFixed(2)}</div>
            <div style="font-size: 9px; color: #6b7280; margin-top: 1px; text-align: right;">6</div>
          </td>
          <td style="padding: 12px 8px; text-align: right; font-size: 11px; color: #374151; vertical-align: middle;">
            <div style="font-family: monospace;">${cessAmount.toFixed(2)}</div>
            <div style="font-size: 9px; color: #6b7280; margin-top: 1px; text-align: right;">0</div>
          </td>
          <td style="padding: 12px 8px; text-align: right; font-size: 11px; font-weight: 600; color: #111827; font-family: monospace; vertical-align: middle;">
            ${amountExclusive.toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    const invoiceDate = new Date(order.date).toLocaleDateString();
    const dueDate = new Date(order.date).toLocaleDateString();

    element.innerHTML = `
      <div style="max-width: 720px; margin: 0 auto; background: #ffffff; box-sizing: border-box;">
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="vertical-align: top; text-align: left; width: 60%;">
              <!-- Logo Container -->
              <div style="width: 70px; height: 70px; margin-bottom: 20px;">
                <img src="/favicon.jpg" style="width: 70px; height: 70px; object-fit: contain; border-radius: 8px;" alt="Logo" onerror="this.src='/favicon.png'" />
              </div>
              <div style="margin-top: 15px; font-size: 12px; color: #374151; line-height: 1.5;">
                <div style="font-weight: 700; color: #111827; font-size: 13px; margin-bottom: 2px;">Single Store</div>
                <div>Deepak K N</div>
                <div>No 3, Single Store (SLT), Kavunthapadi Road,</div>
                <div>Kanjikovil - 638116</div>
                <div>Erode</div>
                <div>Tamil Nadu</div>
                <div>India</div>
              </div>
            </td>
            <td style="vertical-align: top; text-align: right; width: 40%;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 850; color: #111827; font-family: 'Outfit', 'Inter', sans-serif; letter-spacing: 0.5px;">TAX INVOICE</h1>
              <div style="margin-top: 5px; font-size: 12px; font-weight: 700; color: #111827; font-family: monospace;">Invoice# ${invoiceId}</div>
            </td>
          </tr>
        </table>

        <!-- Bill To / Invoice Dates -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 35px; margin-bottom: 25px;">
          <tr>
            <td style="vertical-align: top; text-align: left; width: 55%;">
              <div style="font-size: 12px; color: #4b5563; font-weight: 600; margin-bottom: 4px;">Bill To:</div>
              <div style="font-size: 14px; font-weight: 750; color: #111827; margin-bottom: 2px;">${order.customerName}</div>
              <div style="font-size: 12px; color: #374151; line-height: 1.5; white-space: pre-line;">${address}</div>
              ${phone ? `<div style="font-size: 12px; color: #4b5563; margin-top: 3px;">Phone: ${phone}</div>` : ''}
              ${order.customerEmail ? `<div style="font-size: 12px; color: #4b5563;">Email: ${order.customerEmail}</div>` : ''}
              <div style="font-size: 12px; color: #111827; font-weight: 600; margin-top: 10px;">Place of Supply: <span style="font-weight: 500; color: #374151;">${placeOfSupply}</span></div>
            </td>
            <td style="vertical-align: top; text-align: right; width: 45%;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-left: auto;">
                <tr>
                  <td style="padding: 4px 0; color: #4b5563; font-weight: 600; text-align: right; width: 50%;">Invoice Date :</td>
                  <td style="padding: 4px 0 4px 10px; color: #111827; font-weight: 500; text-align: right; width: 50%;">${invoiceDate}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #4b5563; font-weight: 600; text-align: right;">Due Date :</td>
                  <td style="padding: 4px 0 4px 10px; color: #111827; font-weight: 500; text-align: right;">${dueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #4b5563; font-weight: 600; text-align: right;">Order ID :</td>
                  <td style="padding: 4px 0 4px 10px; color: #111827; font-weight: 500; text-align: right; font-family: monospace; font-size: 11px;">${orderId}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Invoice Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #1d4ed8; color: #ffffff;">
              <th style="padding: 10px 8px; text-align: center; font-size: 10px; font-weight: 700; text-transform: uppercase; width: 30px;">#</th>
              <th style="padding: 10px 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase;">Item Description</th>
              <th style="padding: 10px 8px; text-align: center; font-size: 10px; font-weight: 700; text-transform: uppercase; width: 80px;">HSN/SAC</th>
              <th style="padding: 10px 8px; text-align: center; font-size: 10px; font-weight: 700; text-transform: uppercase; width: 40px;">Qty</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 10px; font-weight: 700; text-transform: uppercase; width: 80px;">Rate</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 10px; font-weight: 700; text-transform: uppercase; width: 80px;">SGST</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 10px; font-weight: 700; text-transform: uppercase; width: 80px;">CGST</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 10px; font-weight: 700; text-transform: uppercase; width: 60px;">Cess</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 10px; font-weight: 700; text-transform: uppercase; width: 95px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Totals Block -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="width: 60%;"></td>
            <td style="width: 40%; vertical-align: top;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.8; margin-left: auto;">
                <tr>
                  <td style="padding: 4px 0; color: #4b5563; font-weight: 500; text-align: left;">Sub Total</td>
                  <td style="padding: 4px 0; color: #111827; font-weight: 600; text-align: right; font-family: monospace;">${subtotalExclusive.toFixed(2)}</td>
                </tr>
                ${hasDiscount ? `
                <tr>
                  <td style="padding: 4px 0; color: #10b981; font-weight: 500; text-align: left;">Coupon Discount</td>
                  <td style="padding: 4px 0; color: #10b981; font-weight: 600; text-align: right; font-family: monospace;">-${discountExclusive.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 4px 0; color: #4b5563; font-weight: 500; text-align: left;">SGST (6%)</td>
                  <td style="padding: 4px 0; color: #111827; font-weight: 600; text-align: right; font-family: monospace;">${sgstTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #4b5563; font-weight: 500; text-align: left;">CGST (6%)</td>
                  <td style="padding: 4px 0; color: #111827; font-weight: 600; text-align: right; font-family: monospace;">${cgstTotal.toFixed(2)}</td>
                </tr>
                <tr style="border-top: 1px solid #d1d5db; border-bottom: 1.5px solid #111827; font-size: 13px;">
                  <td style="padding: 8px 0; color: #111827; font-weight: 850; text-align: left; text-transform: uppercase;">TOTAL</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 850; text-align: right; font-family: monospace;">Rs.${totalPaid.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Notes / Terms / Signature Section -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 40px; border-top: 1px solid #e5e7eb;">
          <tr>
            <td style="vertical-align: top; text-align: left; width: 60%; padding-top: 20px;">
              <div style="margin-bottom: 20px;">
                <div style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 4px;">Notes</div>
                <div style="font-size: 11px; color: #4b5563;">It was great doing business with you.</div>
              </div>
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 4px;">Terms & Conditions</div>
                <div style="font-size: 11px; color: #4b5563;">Refund is Not applicable for this product.</div>
              </div>
            </td>
            <td style="vertical-align: bottom; text-align: right; width: 40%; padding-top: 20px;">
              <!-- Signature Block -->
              <div style="display: inline-block; text-align: right;">
                <div style="width: 150px; height: 60px; margin-left: auto; margin-bottom: 4px;">
                  <img src="/signature.png" style="width: 150px; height: 60px; object-fit: contain;" alt="Signature" />
                </div>
                <div style="font-size: 13px; font-weight: 700; color: #111827; font-family: 'Outfit', 'Inter', sans-serif;">
                  Authorized Signatory
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Invoice_${invoiceId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2.5,
        useCORS: true,
        logging: true,
        letterRendering: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    wrapper.appendChild(element);
    document.body.appendChild(wrapper);

    // Wait 400ms for browser to render styles and image layout
    await new Promise(resolve => setTimeout(resolve, 400));

    // Use the correct API chaining order: .set() -> .from() -> .save()
    await html2pdf().set(opt).from(element).save();

    // Clean up DOM
    document.body.removeChild(wrapper);
  } catch (error) {
    console.error("Failed to generate and download PDF invoice:", error);
    alert("Could not download invoice PDF: " + error.message);
  }
}
