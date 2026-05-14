export default async function handler(req, res) {
    try {
        const { paymentId, userId } = req.query;
        
        return res.status(200).json({ 
            message: "API está viva!", 
            paymentId: paymentId,
            userId: userId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
