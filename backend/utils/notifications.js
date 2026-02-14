const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send price drop alert email
 * @param {string} userEmail - Recipient email
 * @param {Object} product - Product details
 * @param {number} oldPrice - Previous price
 * @param {number} newPrice - Dropped price
 * @param {string} platform - Platform with lowest price
 */
async function sendPriceDropAlert(userEmail, product, oldPrice, newPrice, platform) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`📧 Price drop alert (email not configured):`);
      console.log(`   Product: ${product.name}`);
      console.log(`   Old: ₹${oldPrice} → New: ₹${newPrice} on ${platform}`);
      console.log(`   Would send to: ${userEmail}`);
      return;
    }

    const transporter = createTransporter();
    const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    const buyUrl = product.prices?.[platform]?.url || '#';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .product-card { display: flex; gap: 20px; background: #fafafa; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .product-image { width: 120px; height: 120px; object-fit: contain; border-radius: 8px; background: white; }
        .product-info { flex: 1; }
        .product-name { font-size: 16px; font-weight: 600; color: #333; margin: 0 0 10px; }
        .price-section { margin: 20px 0; }
        .old-price { color: #999; text-decoration: line-through; font-size: 18px; }
        .new-price { color: #16a34a; font-size: 32px; font-weight: 700; }
        .discount-badge { display: inline-block; background: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-left: 10px; }
        .platform-badge { display: inline-block; background: #7c3aed; color: white; padding: 6px 16px; border-radius: 8px; font-weight: 600; text-transform: uppercase; font-size: 12px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .footer { padding: 20px 30px; background: #f9fafb; text-align: center; color: #9ca3af; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Price Drop Alert!</h1>
            <p>A product on your watchlist just got cheaper!</p>
        </div>
        <div class="content">
            <div class="product-card">
                ${product.image ? `<img src="${product.image}" alt="${product.name}" class="product-image">` : ''}
                <div class="product-info">
                    <p class="product-name">${product.name}</p>
                    <span class="platform-badge">${platform}</span>
                </div>
            </div>
            
            <div class="price-section">
                <p><span class="old-price">₹${oldPrice.toLocaleString()}</span></p>
                <p>
                    <span class="new-price">₹${newPrice.toLocaleString()}</span>
                    <span class="discount-badge">${discount}% OFF</span>
                </p>
                <p style="color: #16a34a; font-weight: 600;">You save ₹${(oldPrice - newPrice).toLocaleString()}!</p>
            </div>

            <a href="${buyUrl}" class="cta-button">🛒 Buy Now on ${platform.toUpperCase()}</a>

            <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
                Hurry! This deal might not last long. Prices can change anytime.
            </p>
        </div>
        <div class="footer">
            <p>You received this because you set a price alert on BuyHatke Clone.</p>
            <p>To stop receiving alerts, remove the product from your watchlist.</p>
        </div>
    </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"BuyHatke Price Alerts" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎉 Price Drop! ${product.name} is now ₹${newPrice.toLocaleString()} (${discount}% off)`,
      html: htmlContent
    });

    console.log(`📧 Price drop alert sent to ${userEmail}`);

  } catch (error) {
    console.error('Email send error:', error.message);
  }
}

module.exports = { sendPriceDropAlert };
