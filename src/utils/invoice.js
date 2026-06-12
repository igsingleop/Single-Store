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
    element.style.padding = '40px';
    element.style.fontFamily = "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    element.style.color = '#1f2937';
    element.style.backgroundColor = '#ffffff';
    element.style.width = '720px';
    element.style.margin = '0 auto';
    element.style.boxSizing = 'border-box';
    
    const invoiceId = getOrderInvoiceId(order);
    const address = getOrderAddress(order);
    const phone = getOrderPhone(order, userDetails);
    
    const transactionId = order.transactionId || order.id || 'N/A';
    const orderId = order.orderId || order.razorpayOrderId || `SS-ORD-${Math.abs(hashCode(order.id || '')).toString().padStart(8, '0')}`;
    
    const itemsRows = order.items.map((item, idx) => {
      const qty = item.quantity || 1;
      const rate = parseFloat(item.price);
      const amount = rate * qty;

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; text-align: left; font-size: 12px; color: #374151; vertical-align: top;">
            ${idx + 1}
          </td>
          <td style="padding: 12px 8px; text-align: left; font-size: 12px; color: #374151; vertical-align: top;">
            <div style="font-weight: 700; color: #111827;">${item.title}</div>
            <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">Size: ${item.size} | Frame: ${item.frame}</div>
          </td>
          <td style="padding: 12px 8px; text-align: center; font-size: 12px; color: #374151; vertical-align: top;">
            ${qty}
          </td>
          <td style="padding: 12px 8px; text-align: right; font-size: 12px; color: #374151; font-family: monospace; vertical-align: top;">
            ${rate.toFixed(2)}
          </td>
          <td style="padding: 12px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #111827; font-family: monospace; vertical-align: top;">
            ${amount.toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    const totalPaid = parseFloat(order.total);
    const subtotalBeforeDiscount = order.items.reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0);
    const discountAmount = Math.max(0, subtotalBeforeDiscount - totalPaid);
    const hasDiscount = discountAmount > 0.01;

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
                <img src="/favicon.jpg" style="width: 70px; height: 70px; object-fit: contain; border-radius: 8px;" alt="Logo" />
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
              <h1 style="margin: 0; font-size: 26px; font-weight: 850; color: #111827; font-family: 'Outfit', 'Inter', sans-serif; letter-spacing: 0.5px;">INVOICE</h1>
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
            </td>
            <td style="vertical-align: top; text-align: right; width: 45%;">
              <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-left: auto;">
                <tr>
                  <td style="padding: 4px 0; color: #4b5563; font-weight: 600; text-align: right; width: 45%;">Invoice Date:</td>
                  <td style="padding: 4px 0 4px 10px; color: #111827; font-weight: 500; text-align: right; width: 55%;">${invoiceDate}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #4b5563; font-weight: 600; text-align: right;">Due Date:</td>
                  <td style="padding: 4px 0 4px 10px; color: #111827; font-weight: 500; text-align: right;">${dueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #4b5563; font-weight: 600; text-align: right;">Order ID:</td>
                  <td style="padding: 4px 0 4px 10px; color: #111827; font-weight: 500; text-align: right; font-family: monospace; font-size: 10px; word-break: break-all;">${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #4b5563; font-weight: 600; text-align: right;">Transaction ID:</td>
                  <td style="padding: 4px 0 4px 10px; color: #111827; font-weight: 500; text-align: right; font-family: monospace; font-size: 10px; word-break: break-all;">${transactionId}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Invoice Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #2563eb; color: #ffffff;">
              <th style="padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 40px;">#</th>
              <th style="padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase;">Item Description</th>
              <th style="padding: 10px 8px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 60px;">Qty</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 100px;">Rate</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 120px;">Amount</th>
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
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.6; margin-left: auto;">
                <tr>
                  <td style="padding: 4px 0; color: #4b5563; font-weight: 500; text-align: left;">Sub Total</td>
                  <td style="padding: 4px 0; color: #111827; font-weight: 600; text-align: right; font-family: monospace;">${subtotalBeforeDiscount.toFixed(2)}</td>
                </tr>
                ${hasDiscount ? `
                <tr>
                  <td style="padding: 4px 0; color: #10b981; font-weight: 500; text-align: left;">Coupon Discount</td>
                  <td style="padding: 4px 0; color: #10b981; font-weight: 600; text-align: right; font-family: monospace;">-${discountAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 1px solid #111827; border-bottom: 1px solid #111827;">
                  <td style="padding: 8px 0; color: #111827; font-weight: 850; text-align: left; font-size: 13px; text-transform: uppercase;">TOTAL</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 850; text-align: right; font-size: 14px; font-family: monospace;">Rs.${totalPaid.toFixed(2)}</td>
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
                <div style="font-family: 'Caveat', 'Dancing Script', 'Segoe UI', cursive; font-size: 26px; font-weight: 700; color: #1d4ed8; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 2px; width: 120px; text-align: center; margin-left: auto; margin-bottom: 6px; transform: rotate(-2deg); letter-spacing: 1px; user-select: none;">
                  K. N. Deepak
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

    // Position at top-left of document so that scrollY: 0 captures it perfectly
    element.style.position = 'absolute';
    element.style.left = '0px';
    element.style.top = '0px';
    element.style.zIndex = '-99999';
    element.style.width = '720px';
    document.body.appendChild(element);

    // Wait 400ms for browser to render styles and image layout
    await new Promise(resolve => setTimeout(resolve, 400));

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Invoice_${invoiceId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2.5, 
        useCORS: true,
        logging: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
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
