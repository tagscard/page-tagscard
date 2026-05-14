const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    const { paymentId, userId } = req.query;

    if (!paymentId || !userId) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        // 1. Consultar status no Asaas
        const response = await fetch(`https://www.asaas.com/api/v3/payments/${paymentId}`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });
        const payment = await response.json();

        // Status possíveis: RECEIVED, CONFIRMED, OVERDUE, etc.
        const isPaid = ['RECEIVED', 'CONFIRMED'].includes(payment.status);

        if (isPaid) {
            // 2. Atualizar Supabase usando Service Role (bypass RLS)
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            const { error } = await supabase
                .from('profiles')
                .update({ payment_status: 'confirmed' })
                .eq('id', userId);

            if (error) throw error;
        }

        return res.status(200).json({ 
            status: payment.status, 
            isPaid: isPaid 
        });

    } catch (error) {
        console.error("Check Payment Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
