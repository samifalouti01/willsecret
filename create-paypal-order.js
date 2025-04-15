export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).send({ message: 'Only POST requests allowed' });
    }
  
    const { planType, billingCycle, price, userId } = req.body;
  
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const base = 'https://api-m.sandbox.paypal.com'; // Use live for production
  
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  
    try {
      const response = await fetch(`${base}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: 'USD',
                value: price.toString(),
              },
            },
          ],
          application_context: {
            return_url: `https://willsecret.vercel.app/settings`,
            cancel_url: `https://willsecret.vercel.app/settings`,
          },
        }),
      });
  
      const text = await response.text();
      console.log('PayPal API Status:', response.status);
      console.log('PayPal API Response:', text);
  
      if (!response.ok) {
        return res.status(response.status).json({ error: 'PayPal API error', message: text });
      }
  
      const data = JSON.parse(text);
      const approvalLink = data.links?.find((link) => link.rel === 'approve');
  
      if (!approvalLink) {
        return res.status(500).json({ error: 'Approval link not found', data });
      }
  
      return res.status(200).json({ approvalUrl: approvalLink.href });
    } catch (err) {
      console.error('PayPal Order Creation Error:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
  