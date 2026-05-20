/**
 * AUTOBAHN — Contact form endpoint
 * ──────────────────────────────────
 * Reçoit le POST du formulaire de contact, valide, envoie le mail via Resend
 * au destinataire choisi (Autobahn studio ou créateur sélectionné).
 *
 * Le visiteur reçoit la réponse directement dans son client mail puisqu'on
 * met son adresse en reply_to.
 *
 * Variables d'env attendues :
 *   RESEND_API_KEY — clé API Resend, à configurer dans Vercel
 */

const FROM = 'Autobahn Website <contact@autobahn-studio.com>';
const SUBJECT_LABELS = {
  project:   'Project brief',
  collab:    'Collaboration',
  residency: 'Residency',
  other:     'Contact',
};

export default async function handler(req, res) {
  // Méthode autorisée
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const {
    recipient,
    recipientName,
    fullName,
    senderEmail,
    subject,
    message,
    website, // honeypot — vide pour un humain, rempli par un bot
  } = body;

  // Honeypot anti-spam : si rempli, on accepte sans rien envoyer
  if (website && String(website).length > 0) {
    return res.status(200).json({ ok: true });
  }

  // Validation
  const fullNameStr    = String(fullName    || '').trim();
  const senderEmailStr = String(senderEmail || '').trim();
  const messageStr     = String(message     || '').trim();
  const recipientStr   = String(recipient   || '').trim();

  if (!fullNameStr || !senderEmailStr || !messageStr || !recipientStr) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!isValidEmail(senderEmailStr)) {
    return res.status(400).json({ error: 'Invalid sender email' });
  }
  if (!isValidEmail(recipientStr)) {
    return res.status(400).json({ error: 'Invalid recipient' });
  }
  if (messageStr.length > 5000) {
    return res.status(400).json({ error: 'Message too long' });
  }
  if (fullNameStr.length > 200) {
    return res.status(400).json({ error: 'Name too long' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY missing in env');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  // Construction du mail
  const subjectLabel   = SUBJECT_LABELS[subject] || 'Contact';
  const recipientLabel = String(recipientName || 'Autobahn').trim();
  const mailSubject    = `[Autobahn] ${subjectLabel} — from ${fullNameStr}`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#1a1a18;background:#f5f4f0;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e5e3dd;">
    <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.16em;color:#888;text-transform:uppercase;margin-bottom:8px;">
      New message via autobahn-studio.com
    </div>
    <h2 style="margin:0 0 24px;font-weight:300;font-size:22px;letter-spacing:-0.02em;color:#1a1a18;">
      ${escapeHtml(subjectLabel)}
    </h2>
    <table style="width:100%;font-size:13px;color:#555;margin-bottom:24px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;width:80px;color:#999;">From</td><td style="padding:6px 0;color:#1a1a18;">${escapeHtml(fullNameStr)} &lt;${escapeHtml(senderEmailStr)}&gt;</td></tr>
      <tr><td style="padding:6px 0;color:#999;">To</td><td style="padding:6px 0;color:#1a1a18;">${escapeHtml(recipientLabel)}</td></tr>
    </table>
    <div style="border-top:1px solid #e5e3dd;padding-top:24px;font-size:14px;color:#1a1a18;white-space:pre-wrap;">${escapeHtml(messageStr)}</div>
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e3dd;font-size:11px;color:#999;">
      Reply directly to this email to respond to ${escapeHtml(fullNameStr)}.
    </div>
  </div>
</body></html>`;

  const text = `New message via autobahn-studio.com

Subject: ${subjectLabel}
From: ${fullNameStr} <${senderEmailStr}>
To: ${recipientLabel}

${messageStr}

—
Reply directly to this email to respond to ${fullNameStr}.`;

  // Envoi via Resend
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:     FROM,
        to:       [recipientStr],
        reply_to: senderEmailStr,
        subject:  mailSubject,
        text,
        html,
      }),
    });

    if (!r.ok) {
      const errBody = await r.text().catch(() => '');
      console.error('Resend HTTP', r.status, errBody);
      return res.status(502).json({ error: 'Email service unavailable' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend network error', err);
    return res.status(502).json({ error: 'Network error' });
  }
}

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
