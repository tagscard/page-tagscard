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
        const ASAAS_URL = process.env.ASAAS_URL || 'https://www.asaas.com/api/v3';
        console.log(`Verificando pagamento ${paymentId} para usuário ${userId}...`);

        const response = await fetch(`${ASAAS_URL}/payments/${paymentId}`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });
        const payment = await response.json();

        if (payment.errors) {
            console.error("Erro Asaas:", payment.errors);
            return res.status(400).json({ error: payment.errors[0].description });
        }

        // Status possíveis: RECEIVED, CONFIRMED, OVERDUE, etc.
        const isPaid = ['RECEIVED', 'CONFIRMED'].includes(payment.status);
        console.log(`Status no Asaas: ${payment.status} | Pago: ${isPaid}`);

        if (isPaid) {
            // 2. Atualizar Supabase usando Service Role
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            const { error } = await supabase
                .from('profiles')
                .update({ payment_status: 'confirmed' })
                .eq('id', userId);

            if (error) {
                console.error("Erro Supabase:", error);
                throw error;
            }
            console.log("Perfil atualizado no Supabase com sucesso.");
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
