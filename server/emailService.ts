import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const { apiKey } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: connectionSettings.settings.from_email || 'hello@kreaite.xyz'
  };
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPurchaseConfirmation(
  buyerEmail: string,
  buyerName: string,
  productTitle: string,
  productType: string,
  amount: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px; }
        .logo { color: #FF6B35; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
        h1 { color: #fff; font-size: 24px; margin-bottom: 20px; }
        .product-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .product-title { color: #FF6B35; font-size: 18px; font-weight: bold; }
        .product-type { color: #888; font-size: 14px; text-transform: uppercase; }
        .amount { color: #fff; font-size: 24px; font-weight: bold; margin-top: 10px; }
        .footer { color: #666; font-size: 12px; margin-top: 40px; text-align: center; }
        .cta-button { display: inline-block; background: #FF6B35; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">KreAIte</div>
        <h1>Thank you for your purchase, ${buyerName}!</h1>
        <p>Your order has been confirmed and is being processed.</p>
        
        <div class="product-card">
          <div class="product-type">${productType}</div>
          <div class="product-title">${productTitle}</div>
          <div class="amount">${formattedAmount}</div>
        </div>
        
        <a href="https://kreaite.xyz/my-purchases" class="cta-button">View My Purchases</a>
        
        <div class="footer">
          <p>KreAIte.xyz - CREATE. PUBLISH. EARN.</p>
          <p>Powered by KremersX</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: buyerEmail,
    subject: `Purchase Confirmed: ${productTitle}`,
    html,
    text: `Thank you for your purchase, ${buyerName}! Your order for ${productTitle} (${formattedAmount}) has been confirmed.`,
  });
}

export async function sendCreatorSaleNotification(
  creatorEmail: string,
  creatorName: string,
  productTitle: string,
  saleAmount: number,
  creatorShare: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(saleAmount / 100);
  
  const formattedShare = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(creatorShare / 100);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px; }
        .logo { color: #FF6B35; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
        h1 { color: #fff; font-size: 24px; margin-bottom: 20px; }
        .sale-card { background: linear-gradient(135deg, #FF6B35 0%, #ff8f4d 100%); border-radius: 8px; padding: 20px; margin: 20px 0; }
        .sale-label { color: rgba(0,0,0,0.7); font-size: 14px; text-transform: uppercase; }
        .sale-title { color: #000; font-size: 18px; font-weight: bold; margin: 5px 0; }
        .earnings { color: #000; font-size: 32px; font-weight: bold; }
        .earnings-label { color: rgba(0,0,0,0.7); font-size: 12px; }
        .stats { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0,0,0,0.2); }
        .stat { text-align: center; }
        .stat-value { color: #000; font-weight: bold; }
        .stat-label { color: rgba(0,0,0,0.7); font-size: 12px; }
        .footer { color: #666; font-size: 12px; margin-top: 40px; text-align: center; }
        .cta-button { display: inline-block; background: #FF6B35; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">KreAIte</div>
        <h1>You made a sale! 🎉</h1>
        <p>Congratulations ${creatorName}, someone just purchased your content!</p>
        
        <div class="sale-card">
          <div class="sale-label">New Sale</div>
          <div class="sale-title">${productTitle}</div>
          <div class="earnings">${formattedShare}</div>
          <div class="earnings-label">Your Earnings (85%)</div>
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${formattedTotal}</div>
              <div class="stat-label">Sale Price</div>
            </div>
            <div class="stat">
              <div class="stat-value">85%</div>
              <div class="stat-label">Your Share</div>
            </div>
          </div>
        </div>
        
        <a href="https://kreaite.xyz/author-dashboard" class="cta-button">View Dashboard</a>
        
        <div class="footer">
          <p>KreAIte.xyz - CREATE. PUBLISH. EARN.</p>
          <p>Powered by KremersX</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: creatorEmail,
    subject: `🎉 New Sale: ${productTitle}`,
    html,
    text: `Congratulations ${creatorName}! You made a sale of ${productTitle} for ${formattedTotal}. Your earnings: ${formattedShare} (85%).`,
  });
}

export async function sendNewFollowerNotification(
  creatorEmail: string,
  creatorName: string,
  followerName: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px; }
        .logo { color: #FF6B35; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
        h1 { color: #fff; font-size: 24px; margin-bottom: 20px; }
        .follower-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .follower-name { color: #FF6B35; font-size: 20px; font-weight: bold; }
        .footer { color: #666; font-size: 12px; margin-top: 40px; text-align: center; }
        .cta-button { display: inline-block; background: #FF6B35; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">KreAIte</div>
        <h1>You have a new follower!</h1>
        <p>Hey ${creatorName}, your audience is growing!</p>
        
        <div class="follower-card">
          <div class="follower-name">${followerName}</div>
          <p style="color: #888;">is now following you</p>
        </div>
        
        <a href="https://kreaite.xyz/author-dashboard" class="cta-button">View Your Followers</a>
        
        <div class="footer">
          <p>KreAIte.xyz - CREATE. PUBLISH. EARN.</p>
          <p>Powered by KremersX</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: creatorEmail,
    subject: `${followerName} started following you on KreAIte`,
    html,
    text: `Hey ${creatorName}! ${followerName} is now following you on KreAIte.`,
  });
}

export async function sendPayoutNotification(
  creatorEmail: string,
  creatorName: string,
  amount: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px; }
        .logo { color: #FF6B35; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
        h1 { color: #fff; font-size: 24px; margin-bottom: 20px; }
        .payout-card { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 8px; padding: 30px; margin: 20px 0; text-align: center; }
        .payout-label { color: rgba(255,255,255,0.8); font-size: 14px; text-transform: uppercase; }
        .payout-amount { color: #fff; font-size: 40px; font-weight: bold; margin: 10px 0; }
        .footer { color: #666; font-size: 12px; margin-top: 40px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">KreAIte</div>
        <h1>Payout Sent! 💰</h1>
        <p>Great news ${creatorName}! Your earnings are on the way.</p>
        
        <div class="payout-card">
          <div class="payout-label">Payout Amount</div>
          <div class="payout-amount">${formattedAmount}</div>
          <p style="color: rgba(255,255,255,0.8); margin: 0;">Sent to your connected bank account</p>
        </div>
        
        <p>Funds typically arrive within 2-5 business days depending on your bank.</p>
        
        <div class="footer">
          <p>KreAIte.xyz - CREATE. PUBLISH. EARN.</p>
          <p>Powered by KremersX</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: creatorEmail,
    subject: `💰 Payout Sent: ${formattedAmount}`,
    html,
    text: `Great news ${creatorName}! Your payout of ${formattedAmount} has been sent to your connected bank account.`,
  });
}

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px; }
        .logo { color: #FF6B35; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
        h1 { color: #fff; font-size: 28px; margin-bottom: 20px; }
        .tagline { color: #FF6B35; font-size: 16px; font-weight: bold; margin-bottom: 30px; }
        .studios { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 30px 0; }
        .studio { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 15px; }
        .studio-name { color: #FF6B35; font-weight: bold; }
        .studio-desc { color: #888; font-size: 12px; margin-top: 5px; }
        .footer { color: #666; font-size: 12px; margin-top: 40px; text-align: center; }
        .cta-button { display: inline-block; background: #FF6B35; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">KreAIte</div>
        <h1>Welcome to KreAIte, ${userName}!</h1>
        <div class="tagline">CREATE. PUBLISH. EARN.</div>
        
        <p>You now have access to 6 professional AI-powered studios:</p>
        
        <div class="studios">
          <div class="studio">
            <div class="studio-name">📚 Book Studio</div>
            <div class="studio-desc">Write & publish books with AI</div>
          </div>
          <div class="studio">
            <div class="studio-name">🎵 Music Studio</div>
            <div class="studio-desc">Compose original music</div>
          </div>
          <div class="studio">
            <div class="studio-name">🎬 Video Studio</div>
            <div class="studio-desc">Create & edit videos</div>
          </div>
          <div class="studio">
            <div class="studio-name">🎓 Course Builder</div>
            <div class="studio-desc">Build online courses</div>
          </div>
          <div class="studio">
            <div class="studio-name">🎨 Image Studio</div>
            <div class="studio-desc">Design stunning visuals</div>
          </div>
          <div class="studio">
            <div class="studio-name">📖 Doctrine Engine</div>
            <div class="studio-desc">Build knowledge bases</div>
          </div>
        </div>
        
        <p>Sell your creations on the KreAItorverse marketplace and keep <strong>85% of every sale</strong>!</p>
        
        <a href="https://kreaite.xyz/dashboard" class="cta-button">Start Creating</a>
        
        <div class="footer">
          <p>KreAIte.xyz - Powered by KremersX</p>
          <p>Questions? Contact us at hello@kreaite.xyz</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Welcome to KreAIte - Start Creating Today!`,
    html,
    text: `Welcome to KreAIte, ${userName}! You now have access to 6 professional AI-powered studios. Start creating and earn 85% of every sale on the KreAItorverse marketplace.`,
  });
}
