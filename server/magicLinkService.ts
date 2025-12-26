import crypto from 'crypto';
import { db } from './db';
import { magicLinkTokens, users } from '../shared/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { sendEmail } from './emailService';

const TOKEN_EXPIRY_MINUTES = 15;

export async function generateMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(magicLinkTokens).values({
      email: email.toLowerCase(),
      token,
      expiresAt,
    });

    const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';
    
    const magicLink = `${baseUrl}/magic-link/verify/${token}`;

    const emailResult = await sendEmail({
      to: email,
      subject: 'Your Magic Link to Sign In',
      html: generateMagicLinkEmailHtml(magicLink),
      text: `Sign in to KreAIte using this link: ${magicLink}\n\nThis link expires in ${TOKEN_EXPIRY_MINUTES} minutes.`,
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Magic link generation error:', error);
    return { success: false, error: error.message || 'Failed to generate magic link' };
  }
}

export async function verifyMagicLink(token: string): Promise<{ success: boolean; userId?: string; email?: string; error?: string }> {
  try {
    const [tokenRecord] = await db
      .select()
      .from(magicLinkTokens)
      .where(
        and(
          eq(magicLinkTokens.token, token),
          gt(magicLinkTokens.expiresAt, new Date()),
          isNull(magicLinkTokens.usedAt)
        )
      )
      .limit(1);

    if (!tokenRecord) {
      return { success: false, error: 'Invalid or expired magic link' };
    }

    await db
      .update(magicLinkTokens)
      .set({ usedAt: new Date() })
      .where(eq(magicLinkTokens.id, tokenRecord.id));

    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, tokenRecord.email))
      .limit(1);

    if (!existingUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          email: tokenRecord.email,
          role: 'member',
        })
        .returning();
      existingUser = newUser;
    }

    return { 
      success: true, 
      userId: existingUser.id,
      email: tokenRecord.email 
    };
  } catch (error: any) {
    console.error('Magic link verification error:', error);
    return { success: false, error: error.message || 'Failed to verify magic link' };
  }
}

function generateMagicLinkEmailHtml(magicLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; padding: 40px; }
        .logo { color: #FF6B35; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
        h1 { color: #fff; font-size: 24px; margin-bottom: 20px; }
        p { color: #d0d0d0; line-height: 1.6; }
        .cta-button { display: inline-block; background: #FF6B35; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; font-size: 16px; }
        .cta-button:hover { background: #ff8f4d; }
        .warning { color: #888; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; }
        .footer { color: #666; font-size: 12px; margin-top: 40px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">KreAIte</div>
        <h1>Sign In to Your Account</h1>
        <p>Click the button below to securely sign in to your KreAIte account. No password needed!</p>
        
        <a href="${magicLink}" class="cta-button">Sign In to KreAIte</a>
        
        <p class="warning">
          This link expires in 15 minutes. If you didn't request this email, you can safely ignore it.
        </p>
        
        <div class="footer">
          <p>KreAIte.xyz - CREATE. PUBLISH. EARN.</p>
          <p>Powered by KremersX</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
