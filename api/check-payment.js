module.exports = async (req, res) => {
    const { paymentId, userId } = req.query;

    if (!paymentId || !userId) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        const ASAAS_URL = process.env.ASAAS_URL || 'https://www.asaas.com/api/v3';

        // 1. Consultar status no Asaas
        const response = await fetch(`${ASAAS_URL}/payments/${paymentId}`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });
        const payment = await response.json();

        if (payment.errors) {
            return res.status(400).json({ error: payment.errors[0].description });
        }

        const isPaid = ['RECEIVED', 'CONFIRMED'].includes(payment.status);

        if (isPaid) {
            // 2. Atualizar Supabase via REST API direto (Zero dependências)
            await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ payment_status: 'confirmed' })
            });
        }

        return res.status(200).json({ 
            status: payment.status, 
            isPaid: isPaid 
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
