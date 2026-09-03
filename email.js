// =============================================
// EMAIL CONFIGURATION - NODEMAILER
// =============================================
const nodemailer = require('nodemailer');

// Create transporter - Port 465 (SSL) for Render compatibility
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email transporter ready');
  }
});

// Fallback: If email fails, log to console
async function sendEmail(to, subject, html, text = '') {
  try {
    const info = await transporter.sendMail({
      from: `"SUITFULLY" <${process.env.EMAIL_USER}>`,
      to: to || process.env.EMAIL_TO,
      subject: subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html: html
    });
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    // Fallback: Log to console so we don't lose data
    console.log('📝 EMAIL FALLBACK:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Content:', html);
    return { success: false, error: error.message, fallback: true };
  }
}

// =============================================
// HTML TEMPLATE HELPERS
// =============================================

function getHeader() {
  return `
    <div style="background:linear-gradient(135deg,#003d30,#005f4b);padding:20px;text-align:center;border-radius:4px 4px 0 0;">
      <h1 style="color:#c9a84c;font-family:'Georgia',serif;font-size:1.8rem;margin:0;letter-spacing:2px;">SUITFULLY</h1>
      <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:0.85rem;">Elegance Is Never Accidental—It's Tailored.</p>
    </div>
  `;
}

function getFooter() {
  return `
    <div style="background:#1a1a1a;padding:20px;text-align:center;border-radius:0 0 4px 4px;border-top:1px solid rgba(201,168,76,0.2);">
      <p style="color:rgba(255,255,255,0.4);margin:0;font-size:0.75rem;">
        © 2026 SUITFULLY & Co. — Handmade in Nairobi. Worn Worldwide.
      </p>
      <p style="color:rgba(255,255,255,0.2);margin:4px 0 0;font-size:0.7rem;">
        Hazina Towers, 13th Floor, Suite 4 — Utalii Lane, Nairobi, Kenya
      </p>
    </div>
  `;
}

function getBody(content) {
  return `
    <div style="background:#0f0f0f;padding:30px 20px;font-family:Arial,sans-serif;color:#e8e8e8;max-width:600px;margin:0 auto;">
      ${getHeader()}
      <div style="background:#1a1a1a;padding:30px;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;">
        ${content}
      </div>
      ${getFooter()}
    </div>
  `;
}

// =============================================
// TEST EMAIL
// =============================================
async function sendTestEmail() {
  const content = `
    <h2 style="color:#c9a84c;margin-top:0;">✅ Test Email</h2>
    <p style="color:rgba(255,255,255,0.7);">Your email configuration is working correctly!</p>
    <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;">This is a test email from SUITFULLY.</p>
    <hr style="border-color:#2a2a2a;margin:20px 0;">
    <p style="color:#c9a84c;font-size:1.1rem;">✨ SUITFULLY</p>
  `;
  return await sendEmail(
    process.env.EMAIL_TO,
    'SUITFULLY - Test Email',
    getBody(content)
  );
}

// =============================================
// 1. CONSULTATION BOOKING
// =============================================
async function sendConsultationEmail(data) {
  const { name, email, phone, location, date, time, consultationType, occasion, notes } = data;

  const content = `
    <h2 style="color:#c9a84c;margin-top:0;">📋 New Consultation Booking</h2>
    <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Name:</strong> ${name}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Email:</strong> ${email}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Phone:</strong> ${phone}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Location:</strong> ${location}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Preferred Date:</strong> ${date}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Preferred Time:</strong> ${time}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Consultation Type:</strong> ${consultationType || 'Not specified'}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Occasion:</strong> ${occasion || 'Not specified'}</p>
      ${notes ? `<p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Notes:</strong> ${notes}</p>` : ''}
    </div>
  `;

  // Send to Rick
  await sendEmail(process.env.EMAIL_TO, `Consultation Booking - ${name}`, getBody(content));

  // Send confirmation to customer
  const customerContent = `
    <h2 style="color:#c9a84c;margin-top:0;">Thank You, ${name}!</h2>
    <p style="color:rgba(255,255,255,0.7);">Your consultation booking has been received.</p>
    <p style="color:rgba(255,255,255,0.7);">We'll contact you within <strong style="color:#c9a84c;">24 hours</strong> to confirm your appointment.</p>
    <hr style="border-color:#2a2a2a;margin:20px 0;">
    <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">📅 Date:</strong> ${date}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">🕐 Time:</strong> ${time}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">📍 Location:</strong> ${location}</p>
    </div>
  `;

  await sendEmail(
    email,
    'SUITFULLY - Consultation Booking Confirmation',
    getBody(customerContent)
  );

  return { success: true };
}

// =============================================
// 2. REVIEW SUBMISSION
// =============================================
async function sendReviewEmail(data) {
  const { name, email, rating, title, text, recommend } = data;
  const stars = '★'.repeat(parseInt(rating)) + '☆'.repeat(5 - parseInt(rating));

  const content = `
    <h2 style="color:#c9a84c;margin-top:0;">⭐ New Review Submitted</h2>
    <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Name:</strong> ${name}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Email:</strong> ${email}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Rating:</strong> ${stars} (${rating}/5)</p>
      ${title ? `<p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Title:</strong> ${title}</p>` : ''}
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Review:</strong></p>
      <p style="background:rgba(0,0,0,0.3);padding:12px;border-radius:4px;color:rgba(255,255,255,0.7);">${text}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Recommend:</strong> ${recommend || 'Yes'}</p>
    </div>
  `;

  await sendEmail(process.env.EMAIL_TO, `New Review - ${name} (${rating}★)`, getBody(content));

  // Send confirmation to reviewer
  const customerContent = `
    <h2 style="color:#c9a84c;margin-top:0;">Thank You, ${name}!</h2>
    <p style="color:rgba(255,255,255,0.7);">We truly appreciate you taking the time to share your experience with SUITFULLY.</p>
    <p style="color:rgba(255,255,255,0.7);">Your review helps other gentlemen discover the art of bespoke tailoring.</p>
    <hr style="border-color:#2a2a2a;margin:20px 0;">
    <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Your Rating:</strong> ${stars}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Your Review:</strong></p>
      <p style="background:rgba(0,0,0,0.3);padding:12px;border-radius:4px;color:rgba(255,255,255,0.7);">${text}</p>
    </div>
  `;

  await sendEmail(
    email,
    'SUITFULLY - Thank You for Your Review!',
    getBody(customerContent)
  );

  return { success: true };
}

// =============================================
// 3. NEWSLETTER SUBSCRIPTION
// =============================================
async function sendNewsletterEmail(email) {
  const content = `
    <h2 style="color:#c9a84c;margin-top:0;">📬 New Newsletter Subscription</h2>
    <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Email:</strong> ${email}</p>
    </div>
  `;

  await sendEmail(process.env.EMAIL_TO, `Newsletter Subscription - ${email}`, getBody(content));

  // Send welcome email to subscriber
  const customerContent = `
    <h2 style="color:#c9a84c;margin-top:0;">Welcome to SUITFULLY!</h2>
    <p style="color:rgba(255,255,255,0.7);">Thank you for subscribing to our newsletter.</p>
    <p style="color:rgba(255,255,255,0.7);">You'll receive:</p>
    <ul style="color:rgba(255,255,255,0.6);">
      <li>✨ Exclusive offers</li>
      <li>👔 Style tips and trends</li>
      <li>🆕 Early access to new collections</li>
      <li>🎉 Special event invitations</li>
    </ul>
    <hr style="border-color:#2a2a2a;margin:20px 0;">
    <p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">Welcome to the SUITFULLY community. We're honored to have you.</p>
  `;

  await sendEmail(
    email,
    'Welcome to SUITFULLY Community!',
    getBody(customerContent)
  );

  return { success: true };
}

// =============================================
// 4. ORDER CONFIRMATION
// =============================================
async function sendOrderEmail(data) {
  const { orderId, firstName, lastName, email, phone, items, total, delivery, payment, notes, shippingAddress } = data;

  let itemsHtml = items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.7);">${item.name}</td>
      <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;color:rgba(255,255,255,0.7);">${item.qty}</td>
      <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;color:rgba(255,255,255,0.7);">$${item.price.toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;font-weight:bold;color:#c9a84c;">$${(item.price * item.qty).toFixed(2)}</td>
    </tr>
  `).join('');

  // Calculate delivery cost
  const deliveryCost = delivery && delivery.price ? delivery.price : 0;

  const content = `
    <h2 style="color:#c9a84c;margin-top:0;">🧾 Order Confirmation #${orderId}</h2>
    <p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">Thank you for your order. We're crafting your garments with care.</p>
    <hr style="border-color:#2a2a2a;margin:20px 0;">

    <h3 style="color:#c9a84c;font-size:1rem;margin-bottom:8px;">Customer Details</h3>
    <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Name:</strong> ${firstName} ${lastName}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Email:</strong> ${email}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Phone:</strong> ${phone}</p>
      ${shippingAddress ? `<p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Shipping:</strong> ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.country}</p>` : ''}
    </div>

    <hr style="border-color:#2a2a2a;margin:20px 0;">

    <h3 style="color:#c9a84c;font-size:1rem;margin-bottom:8px;">Order Items</h3>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:rgba(201,168,76,0.1);">
          <th style="padding:8px;text-align:left;color:#c9a84c;font-size:0.8rem;">Item</th>
          <th style="padding:8px;text-align:center;color:#c9a84c;font-size:0.8rem;">Qty</th>
          <th style="padding:8px;text-align:right;color:#c9a84c;font-size:0.8rem;">Price</th>
          <th style="padding:8px;text-align:right;color:#c9a84c;font-size:0.8rem;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:12px;text-align:right;color:rgba(255,255,255,0.6);">Subtotal:</td>
          <td style="padding:12px;text-align:right;color:rgba(255,255,255,0.7);">$${total.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding:8px;text-align:right;color:rgba(255,255,255,0.6);">Delivery:</td>
          <td style="padding:8px;text-align:right;color:rgba(255,255,255,0.7);">${deliveryCost === 0 ? 'Free' : '$' + deliveryCost.toFixed(2)}</td>
        </tr>
        <tr style="border-top:2px solid #c9a84c;">
          <td colspan="3" style="padding:12px;text-align:right;font-size:1.1rem;font-weight:bold;color:#c9a84c;">Total:</td>
          <td style="padding:12px;text-align:right;font-size:1.1rem;font-weight:bold;color:#c9a84c;">$${(total + deliveryCost).toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <hr style="border-color:#2a2a2a;margin:20px 0;">

    <h3 style="color:#c9a84c;font-size:1rem;margin-bottom:8px;">Delivery</h3>
    <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Method:</strong> ${delivery ? delivery.name : 'Standard'}</p>
      ${delivery && delivery.time ? `<p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Estimated Time:</strong> ${delivery.time}</p>` : ''}
    </div>

    <hr style="border-color:#2a2a2a;margin:20px 0;">

    <h3 style="color:#c9a84c;font-size:1rem;margin-bottom:8px;">Payment</h3>
    <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Method:</strong> ${payment.charAt(0).toUpperCase() + payment.slice(1)}</p>
    </div>

    ${notes ? `
      <hr style="border-color:#2a2a2a;margin:20px 0;">
      <h3 style="color:#c9a84c;font-size:1rem;margin-bottom:8px;">Order Notes</h3>
      <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
        <p style="color:rgba(255,255,255,0.7);">${notes}</p>
      </div>
    ` : ''}

    <hr style="border-color:#2a2a2a;margin:20px 0;">
    <p style="color:rgba(255,255,255,0.4);font-size:0.8rem;">We'll notify you when your items are ready for delivery.</p>
  `;

  // Send to Rick
  await sendEmail(process.env.EMAIL_TO, `Order Confirmation #${orderId}`, getBody(content));

  // Send confirmation to customer
  const customerContent = `
    <h2 style="color:#c9a84c;margin-top:0;">Thank You, ${firstName}!</h2>
    <p style="color:rgba(255,255,255,0.7);">Your order <strong style="color:#c9a84c;">#${orderId}</strong> has been confirmed.</p>
    <p style="color:rgba(255,255,255,0.7);">We're now crafting your garments with attention to detail.</p>
    <hr style="border-color:#2a2a2a;margin:20px 0;">
    <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Order Total:</strong> $${(total + deliveryCost).toFixed(2)}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Delivery Method:</strong> ${delivery ? delivery.name : 'Standard'}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Payment Method:</strong> ${payment.charAt(0).toUpperCase() + payment.slice(1)}</p>
    </div>
    <hr style="border-color:#2a2a2a;margin:20px 0;">
    <p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">You'll receive tracking information once your order ships.</p>
  `;

  await sendEmail(
    email,
    `SUITFULLY - Order #${orderId} Confirmed`,
    getBody(customerContent)
  );

  return { success: true };
}

// =============================================
// 5. PAYMENT PROOF SUBMISSION
// =============================================
async function sendPaymentProofEmail(data) {
  const { orderNumber, referenceNumber, customerName, customerEmail, fileName, submittedVia, notes } = data;

  const content = `
    <h2 style="color:#c9a84c;margin-top:0;">📎 Payment Proof Submitted</h2>
    <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Order:</strong> ${orderNumber || 'N/A'}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Customer Name:</strong> ${customerName || 'N/A'}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Customer Email:</strong> ${customerEmail || 'N/A'}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Reference Number:</strong> ${referenceNumber}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">File:</strong> ${fileName || 'N/A'}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Submitted Via:</strong> ${submittedVia || 'Website'}</p>
      ${notes ? `<p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Notes:</strong> ${notes}</p>` : ''}
    </div>
    <hr style="border-color:#2a2a2a;margin:20px 0;">
    <p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">Please verify this payment and update the order status accordingly.</p>
  `;

  // Send to Rick
  await sendEmail(process.env.EMAIL_TO, `Payment Proof - ${orderNumber || 'New Order'}`, getBody(content));

  // Send confirmation to customer
  if (customerEmail) {
    const customerContent = `
      <h2 style="color:#c9a84c;margin-top:0;">Thank You!</h2>
      <p style="color:rgba(255,255,255,0.7);">We have received your proof of payment for order <strong style="color:#c9a84c;">${orderNumber || 'your order'}</strong>.</p>
      <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
        <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Reference Number:</strong> ${referenceNumber}</p>
      </div>
      <p style="color:rgba(255,255,255,0.7);">We will verify and confirm your payment within <strong style="color:#c9a84c;">24 hours</strong>.</p>
      <hr style="border-color:#2a2a2a;margin:20px 0;">
      <p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">If you have any questions, please contact us at +254 741 870305</p>
    `;

    await sendEmail(
      customerEmail,
      'SUITFULLY - Payment Proof Received',
      getBody(customerContent)
    );
  }

  return { success: true };
}

// =============================================
// 6. EMAIL VERIFICATION - ADDED
// =============================================
async function sendEmailVerification(email, username, verificationLink) {
  const content = `
    <h2 style="color:#c9a84c;margin-top:0;">🔐 Verify Your Email</h2>
    <p style="color:rgba(255,255,255,0.7);">Hello ${username || 'Administrator'},</p>
    <p style="color:rgba(255,255,255,0.7);">Thank you for creating your SUITFULLY admin account.</p>
    <p style="color:rgba(255,255,255,0.7);">Please click the button below to verify your email address:</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${verificationLink}" style="display:inline-block;padding:14px 32px;background:#c9a84c;color:#000000;border-radius:4px;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;">
        Verify Email
      </a>
    </div>
    <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;">This link expires in 24 hours.</p>
    <p style="color:rgba(255,255,255,0.4);font-size:0.8rem;">If you didn't create this account, please ignore this email.</p>
    <hr style="border-color:#2a2a2a;margin:20px 0;">
    <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;">SUITFULLY - Elegance Is Never Accidental—It's Tailored.</p>
  `;

  const html = getBody(content);
  await sendEmail(email, 'SUITFULLY - Verify Your Email', html);
  return { success: true };
}

// =============================================
// 7. 2FA VERIFICATION CODE
// =============================================
async function send2FACodeEmail(email, code, username) {
  const content = `
    <h2 style="color:#c9a84c;margin-top:0;">🔐 Your 2FA Verification Code</h2>
    <p style="color:rgba(255,255,255,0.7);">Hello ${username || 'Administrator'},</p>
    <p style="color:rgba(255,255,255,0.7);">Your two-factor authentication verification code is:</p>
    <div style="background:rgba(201,168,76,0.1);padding:20px;text-align:center;border-radius:4px;border:1px solid rgba(201,168,76,0.2);margin:20px 0;">
      <span style="font-size:2rem;font-weight:bold;color:#c9a84c;letter-spacing:8px;font-family:monospace;">${code}</span>
    </div>
    <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;">This code expires in 5 minutes.</p>
    <p style="color:rgba(255,255,255,0.4);font-size:0.8rem;">If you didn't request this code, please contact SUITFULLY support immediately.</p>
  `;

  await sendEmail(
    email,
    'SUITFULLY - 2FA Verification Code',
    getBody(content)
  );

  return { success: true };
}

// =============================================
// 8. GENERIC STATUS UPDATE EMAIL
// =============================================
async function sendStatusUpdateEmail(email, orderId, status, firstName) {
  const statusMessages = {
    'shipped': 'Your order has been shipped and is on its way to you.',
    'delivered': 'Your order has been delivered. We hope you love your SUITFULLY garments.',
    'cancelled': 'Your order has been cancelled. Please contact us if you have any questions.'
  };

  const message = statusMessages[status] || `Your order status has been updated to: ${status}`;

  const content = `
    <h2 style="color:#c9a84c;margin-top:0;">📦 Order Status Update</h2>
    <p style="color:rgba(255,255,255,0.7);">Hello ${firstName || 'Sir'},</p>
    <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Order:</strong> #${orderId}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
      <p style="color:rgba(255,255,255,0.7);">${message}</p>
    </div>
    <hr style="border-color:#2a2a2a;margin:20px 0;">
    <p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">Thank you for choosing SUITFULLY.</p>
  `;

  await sendEmail(
    email,
    `SUITFULLY - Order #${orderId} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    getBody(content)
  );

  return { success: true };
}

// =============================================
// 9. LOW STOCK ALERT
// =============================================
async function sendLowStockAlert(productName, quantity) {
  const content = `
    <h2 style="color:#c9a84c;margin-top:0;">⚠️ Low Stock Alert</h2>
    <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.05);">
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Product:</strong> ${productName}</p>
      <p style="color:rgba(255,255,255,0.7);"><strong style="color:#c9a84c;">Stock Remaining:</strong> ${quantity}</p>
    </div>
    <p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">Please restock this product.</p>
  `;

  await sendEmail(
    process.env.EMAIL_TO,
    `Low Stock Alert - ${productName}`,
    getBody(content)
  );

  return { success: true };
}

// =============================================
// EXPORT ALL FUNCTIONS
// =============================================
module.exports = {
  sendEmail,
  sendTestEmail,
  sendConsultationEmail,
  sendReviewEmail,
  sendNewsletterEmail,
  sendOrderEmail,
  sendPaymentProofEmail,
  sendEmailVerification,
  send2FACodeEmail,
  sendStatusUpdateEmail,
  sendLowStockAlert
};