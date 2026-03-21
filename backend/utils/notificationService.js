const nodemailer = require('nodemailer');

/**
 * Create reusable transporter.
 * Falls back to Ethereal (test account) if SMTP credentials are not configured.
 */
let transporter = null;

async function getTransporter() {
    if (transporter) return transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log('✅ Email transporter: SMTP configured');
    } else {
        // Development: use Ethereal test account
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
        console.log('📧 Email transporter: Ethereal test account (preview URLs will be logged)');
    }

    return transporter;
}

/**
 * Send price drop alert email
 */
async function sendPriceDropEmail({ to, productName, targetPrice, currentPrice, platform, productUrl }) {
    try {
        const t = await getTransporter();
        const discount = Math.round(((targetPrice - currentPrice) / targetPrice) * 100);
        const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

        const info = await t.sendMail({
            from: `"PriceTrackr" <${process.env.SMTP_FROM || 'alerts@pricetrackr.in'}>`,
            to,
            subject: `🎉 Price Drop Alert: ${productName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 12px;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 8px; text-align: center;">
                    <h1 style="margin:0;font-size:24px;">🔔 Price Drop Detected!</h1>
                  </div>
                  <div style="background: white; padding: 24px; border-radius: 8px; margin-top: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h2 style="color: #1a1a2e; margin-top:0;">${productName}</h2>
                    <table style="width:100%; border-collapse:collapse;">
                      <tr>
                        <td style="padding:8px; color:#6b7280;">Your target price:</td>
                        <td style="padding:8px; font-weight:bold; color:#374151;">₹${targetPrice.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style="background:#f0fdf4;">
                        <td style="padding:8px; color:#6b7280;">Current price on ${platformLabel}:</td>
                        <td style="padding:8px; font-weight:bold; color:#16a34a; font-size:20px;">₹${currentPrice.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px; color:#6b7280;">You save:</td>
                        <td style="padding:8px; font-weight:bold; color:#dc2626;">${discount}% off your target</td>
                      </tr>
                    </table>
                    <div style="text-align:center; margin-top:24px;">
                      <a href="${productUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
                        Buy on ${platformLabel} Now →
                      </a>
                    </div>
                  </div>
                  <p style="text-align:center; color:#9ca3af; font-size:12px; margin-top:16px;">
                    You're receiving this because you set a price alert on PriceTrackr.<br>
                    <a href="#" style="color:#667eea;">Unsubscribe</a>
                  </p>
                </div>
            `,
        });

        // Log preview URL in development
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`📧 Preview email at: ${previewUrl}`);
        }

        console.log(`✅ Price alert email sent to ${to}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Email send error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send FCM push notification (stub — replace with actual FCM SDK call)
 * Requires: npm install firebase-admin
 */
async function sendPushNotification({ pushToken, productName, currentPrice, platform }) {
    if (!pushToken) return { success: false, error: 'No push token' };

    try {
        // Firebase Admin SDK integration point
        // const admin = require('firebase-admin');
        // const message = { notification: { title: '🔔 Price Drop!', body: `${productName} is now ₹${currentPrice} on ${platform}` }, token: pushToken };
        // await admin.messaging().send(message);
        console.log(`📱 [Push stub] Would send: "${productName} now ₹${currentPrice}" to token ${pushToken.substring(0, 12)}...`);
        return { success: true };
    } catch (error) {
        console.error('❌ Push notification error:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { sendPriceDropEmail, sendPushNotification };
