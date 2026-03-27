const sgMail = require('@sendgrid/mail');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  sgMail.setApiKey(apiKey);

  const { type, phone, name, email, ref, notes } = req.body;

  let subject, text;

  if (type === 'notify') {
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    subject = `[TEC] Signal list — ${name || 'anonymous'}`;
    text = [
      'New signal list signup',
      '',
      `Name:  ${name || '—'}`,
      `Phone: ${phone}`,
      `Email: ${email || '—'}`,
    ].join('\n');
  } else if (type === 'apply') {
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
    subject = `[TEC] Application — ${name}`;
    text = [
      'New clearance application — Vol. 03',
      '',
      `Name:              ${name}`,
      `Phone:             ${phone}`,
      `Email:             ${email || '—'}`,
      `How they found TEC: ${ref || '—'}`,
      `Field experience:  ${notes || '—'}`,
    ].join('\n');
  } else {
    return res.status(400).json({ error: 'Invalid form type' });
  }

  const to = process.env.SENDGRID_TO || 'hello@topologyexploration.club';
  const from = process.env.SENDGRID_FROM || 'hello@topologyexploration.club';

  try {
    await sgMail.send({ to, from, subject, text });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[TEC] SendGrid error:', err.response?.body || err.message);
    return res.status(500).json({ error: 'Failed to send' });
  }
};
