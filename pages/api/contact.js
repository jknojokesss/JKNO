export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, business } = req.body
  if (!name || !email || !business) return res.status(400).json({ error: 'Missing fields' })

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'JK No Jokes <onboarding@resend.dev>',
        to: ['jk@jknojokes.com'],
        subject: `New inquiry from ${name} — ${business}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; color: #1A1A2E;">
            <div style="border-bottom: 2px solid #C9A84C; padding-bottom: 20px; margin-bottom: 30px;">
              <h1 style="font-size: 24px; margin: 0; letter-spacing: -0.5px;">JK<span style="color: #C9A84C;">.</span></h1>
              <p style="font-size: 11px; letter-spacing: 3px; color: #C9A84C; margin: 4px 0 0; font-family: monospace;">NEW INQUIRY</p>
            </div>
            <p style="font-size: 13px; color: #7A8090; font-family: monospace; letter-spacing: 1px; margin-bottom: 24px;">SOMEONE FILLED OUT YOUR CONTACT FORM</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #EEEAE2;">
                <td style="padding: 14px 0; font-size: 11px; color: #AAA098; font-family: monospace; letter-spacing: 1px; width: 120px;">NAME</td>
                <td style="padding: 14px 0; font-size: 15px; color: #1A1A2E;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #EEEAE2;">
                <td style="padding: 14px 0; font-size: 11px; color: #AAA098; font-family: monospace; letter-spacing: 1px;">EMAIL</td>
                <td style="padding: 14px 0; font-size: 15px; color: #1A1A2E;"><a href="mailto:${email}" style="color: #C9A84C;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 14px 0; font-size: 11px; color: #AAA098; font-family: monospace; letter-spacing: 1px;">BUSINESS</td>
                <td style="padding: 14px 0; font-size: 15px; color: #1A1A2E;">${business}</td>
              </tr>
            </table>
            <div style="margin-top: 32px; padding: 16px; background: #F7F4EF; border-left: 3px solid #C9A84C;">
              <p style="margin: 0; font-size: 13px; color: #5A6070;">Reply directly to this email to respond to ${name}.</p>
            </div>
          </div>
        `,
        reply_to: email,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Resend error:', err)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Contact error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
