
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, method, plan, cardData } = req.body;
  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  const ASAAS_URL = process.env.ASAAS_URL || 'https://www.asaas.com/api/v3';

  try {
    // 1. Criar ou Localizar Cliente no Asaas
    const customerResponse = await fetch(`${ASAAS_URL}/customers`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        mobilePhone: phone,
        notificationDisabled: false
      })
    });
    
    const customer = await customerResponse.json();
    if (customer.errors) throw new Error(customer.errors[0].description);

    // 2. Definir valor do plano (Simulação de valores reais)
    const planPrices = {
      digital: 49.90,
      premium: 149.00,
      business: 399.00
    };
    const value = planPrices[plan] || 149.00;

    // 3. Criar a Cobrança
    const paymentBody = {
      customer: customer.id,
      billingType: method === 'pix' ? 'PIX' : 'CREDIT_CARD',
      value: value,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 1 dia de vencimento
      description: `Assinatura Tagscard - Plano ${plan.toUpperCase()}`,
    };

    if (method === 'credit_card' && cardData) {
      paymentBody.creditCard = {
        holderName: cardData.holderName,
        number: cardData.number,
        expiryMonth: cardData.expiry.split('/')[0],
        expiryYear: '20' + cardData.expiry.split('/')[1],
        cvv: cardData.cvv
      };
      paymentBody.creditCardHolderInfo = {
        name,
        email,
        cpfCnpj: '00000000000', // Nota: Asaas exige CPF real para cartão. Precisaremos adicionar esse campo no checkout.
        postalCode: '00000000',
        addressNumber: '1',
        mobilePhone: phone
      };
    }

    const paymentResponse = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentBody)
    });

    const payment = await paymentResponse.json();
    if (payment.errors) throw new Error(payment.errors[0].description);

    // 4. Se for PIX, buscar o QR Code
    if (method === 'pix') {
      const pixResponse = await fetch(`${ASAAS_URL}/payments/${payment.id}/pixQrCode`, {
        headers: { 'access_token': ASAAS_API_KEY }
      });
      const pixData = await pixResponse.json();
      return res.status(200).json({ ...payment, pix: pixData });
    }

    return res.status(200).json(payment);

  } catch (error) {
    console.error('Asaas Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
