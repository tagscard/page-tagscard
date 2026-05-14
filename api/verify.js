export default async function handler(req, res) {
    const { paymentId, userId } = req.query;
    
    const envStatus = {
        hasAsaasKey: !!process.env.ASAAS_API_KEY,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    if (!envStatus.hasAsaasKey || !envStatus.hasSupabaseUrl || !envStatus.hasSupabaseKey) {
        return res.status(200).json({ 
            error: "Variáveis de ambiente ausentes", 
            details: envStatus 
        });
    }

    try {
        const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const ASAAS_URL = process.env.ASAAS_URL || 'https://www.asaas.com/api/v3';

        const response = await fetch(`${ASAAS_URL}/payments/${paymentId}`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });
        const payment = await response.json();
        const isPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(payment.status);

        // SE FOI PAGO, ATUALIZAR O SUPABASE AGORA MESMO
        if (isPaid && userId) {
            console.log(`Pagamento confirmado para o usuário ${userId}. Atualizando Supabase...`);
            await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ payment_status: 'confirmed' })
            });
        }

        return res.status(200).json({ 
            status: payment.status, 
            isPaid: isPaid,
            envCheck: "OK"
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
