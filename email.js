// =============================================
// EMAIL CONFIGURATION - NODEMAILER
// =============================================
const nodemailer = require('nodemailer');

// Create transporter - FIXED for IPv6/IPv4 compatibility
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email transporter ready');
  }
});

// Send email function
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
    throw error;
  }
}

// Send test email
async function sendTestEmail() {
  return await sendEmail(
    process.env.EMAIL_TO,
    'SUITFULLY - Test Email',
    '<h2>✅ Test Email</h2><p>Your email configuration is working correctly!</p><p style="color:#c9a84c;">✨ SUITFULLY</p>'
  );
}

// 1. Send Consultation Booking
async function sendConsultationEmail(data) {
  const { name, email, phone, location, date, time, consultationType, occasion, notes } = data;

  const html = `
    <h2>📋 New Consultation Booking</h2>
    <hr>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>Preferred Date:</strong> ${date}</p>
    <p><strong>Preferred Time:</strong> ${time}</p>
    <p><strong>Consultation Type:</strong> ${consultationType || 'Not specified'}</p>
    <p><strong>Occasion:</strong> ${occasion || 'Not specified'}</p>
    ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
    <hr>
    <p style="color:#c9a84c;font-size:1.1rem;">✨ SUITFULLY - Elegance Is Never Accidental—It's Tailored.</p>
  `;

  // Send to Rick
  await sendEmail(process.env.EMAIL_TO, `Consultation Booking - ${name}`, html);

  // Send confirmation to customer
  await sendEmail(
    email,
    'SUITFULLY - Consultation Booking Confirmation',
    `
      <h2>Thank You, ${name}!</h2>
      <p>Your consultation booking has been received. We'll contact you within 24 hours to confirm your appointment.</p>
      <hr>
      <p><strong>Booking Details:</strong></p>
      <p>📅 Date: ${date}</p>
      <p>🕐 Time: ${time}</p>
      <p>📍 Location: ${location}</p>
      <hr>
      <p style="color:#c9a84c;">✨ SUITFULLY - Elegance Is Never Accidental—It's Tailored.</p>
    `
  );

  return { success: true };
}

// 2. Send Review
async function sendReviewEmail(data) {
  const { name, email, rating, title, text, recommend } = data;
  const stars = '★'.repeat(parseInt(rating)) + '☆'.repeat(5 - parseInt(rating));

  const html = `
    <h2>⭐ New Review Submitted</h2>
    <hr>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Rating:</strong> ${stars} (${rating}/5)</p>
    ${title ? `<p><strong>Title:</strong> ${title}</p>` : ''}
    <p><strong>Review:</strong></p>
    <p style="background:#f5f5f5;padding:12px;border-radius:4px;">${text}</p>
    <p><strong>Recommend:</strong> ${recommend || 'Yes'}</p>
    <hr>
    <p style="color:#c9a84c;font-size:1.1rem;">✨ SUITFULLY - Elegance Is Never Accidental—It's Tailored.</p>
  `;

  // Send to Rick
  await sendEmail(process.env.EMAIL_TO, `New Review - ${name} (${rating}★)`, html);

  // Send confirmation to reviewer
  await sendEmail(
    email,
    'SUITFULLY - Thank You for Your Review!',
    `
      <h2>Thank You, ${name}!</h2>
      <p>We truly appreciate you taking the time to share your experience with SUITFULLY.</p>
      <p>Your review helps other gentlemen discover the art of bespoke tailoring.</p>
      <hr>
      <p><strong>Your Rating:</strong> ${stars}</p>
      <p><strong>Your Review:</strong></p>
      <p style="background:#f5f5f5;padding:12px;border-radius:4px;">${text}</p>
      <hr>
      <p style="color:#c9a84c;">✨ SUITFULLY - Elegance Is Never Accidental—It's Tailored.</p>
    `
  );

  return { success: true };
}

// 3. Send Newsletter Subscription
async function sendNewsletterEmail(email) {
  const html = `
    <h2>📬 New Newsletter Subscription</h2>
    <hr>
    <p><strong>Email:</strong> ${email}</p>
    <hr>
    <p style="color:#c9a84c;font-size:1.1rem;">✨ SUITFULLY - Elegance Is Never Accidental—It's Tailored.</p>
  `;

  // Send to Rick
  await sendEmail(process.env.EMAIL_TO, `Newsletter Subscription - ${email}`, html);

  // Send welcome email to subscriber
  await sendEmail(
    email,
    'Welcome to SUITFULLY Community!',
    `
      <h2>Welcome to SUITFULLY!</h2>
      <p>Thank you for subscribing to our newsletter.</p>
      <p>You'll receive exclusive offers, style tips, and early access to new collections.</p>
      <hr>
      <p style="color:#c9a84c;">✨ SUITFULLY - Elegance Is Never Accidental—It's Tailored.</p>
    `
  );

  return { success: true };
}

// 4. Send Order Confirmation
async function sendOrderEmail(data) {
  const { orderId, firstName, lastName, email, phone, items, total, delivery, payment, notes } = data;

  let itemsHtml = items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${item.price.toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">$${(item.price * item.qty).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <h2>🧾 Order Confirmation #${orderId}</h2>
    <hr>
    <h3>Customer Details</h3>
    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <hr>
    <h3>Order Items</h3>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;text-align:left;">Item</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Price</th>
          <th style="padding:8px;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:12px;text-align:right;font-weight:bold;">Subtotal:</td>
          <td style="padding:12px;text-align:right;font-weight:bold;">$${total.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding:8px;text-align:right;font-weight:bold;">Delivery:</td>
          <td style="padding:8px;text-align:right;font-weight:bold;">${delivery && delivery.price ? '$' + delivery.price.toFixed(2) : 'Free'}</td>
        </tr>
        <tr style="border-top:2px solid #c9a84c;">
          <td colspan="3" style="padding:12px;text-align:right;font-size:1.2rem;font-weight:bold;">Total:</td>
          <td style="padding:12px;text-align:right;font-size:1.2rem;font-weight:bold;color:#c9a84c;">$${total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
    <hr>
    <h3>Delivery</h3>
    <p><strong>Method:</strong> ${delivery ? delivery.name : 'Standard'}</p>
    <hr>
    <h3>Payment</h3>
    <p><strong>Method:</strong> ${payment.charAt(0).toUpperCase() + payment.slice(1)}</p>
    ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
    <hr>
    <p style="color:#c9a84c;font-size:1.1rem;">✨ SUITFULLY - Elegance Is Never Accidental—It's Tailored.</p>
  `;

  // Send to Rick
  await sendEmail(process.env.EMAIL_TO, `Order Confirmation #${orderId}`, html);

  // Send confirmation to customer
  await sendEmail(
    email,
    `SUITFULLY - Order #${orderId} Confirmed`,
    `
      <h2>Thank You, ${firstName}!</h2>
      <p>Your order <strong>#${orderId}</strong> has been confirmed.</p>
      <p>We'll notify you when your items are ready for delivery.</p>
      <hr>
      <p><strong>Order Total:</strong> $${total.toFixed(2)}</p>
      <p><strong>Delivery Method:</strong> ${delivery ? delivery.name : 'Standard'}</p>
      <hr>
      <p style="color:#c9a84c;">✨ SUITFULLY - Elegance Is Never Accidental—It's Tailored.</p>
    `
  );

  return { success: true };
}

module.exports = {
  sendEmail,
  sendTestEmail,
  sendConsultationEmail,
  sendReviewEmail,
  sendNewsletterEmail,
  sendOrderEmail
};