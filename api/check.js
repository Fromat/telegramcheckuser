// api/check.js
const axios = require('axios'); 

module.exports = async (req, res) => {
    // --- CORS (Cross-Origin Resource Sharing) Ayarları ---
    // Unity uygulamasının isteği kabul etmesi için gereklidir
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('');
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // --- Gelen Veriyi Alma ---
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id zorunludur.' });
    }

    // --- Güvenli Ortam Değişkenlerini Alma (Vercel'de tanımlanacak) ---
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID; 

    if (!BOT_TOKEN || !CHAT_ID) {
        console.error("Ortam Değişkenleri eksik!");
        return res.status(500).json({ error: 'Sunucu yapılandırması eksik.' });
    }

    const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`;

    try {
        // --- Telegram API Çağrısı ---
        const response = await axios.get(TELEGRAM_API_URL, {
            params: {
                chat_id: CHAT_ID,
                user_id: user_id
            }
        });

        // --- Cevabı İşleme ---
        const status = response.data.result.status;
        let isMember = false;

        // 'member', 'administrator' ve 'creator' üye sayılır
        if (['member', 'administrator', 'creator'].includes(status)) {
            isMember = true;
        }

        // --- Unity'ye Sonucu Gönderme ---
        return res.status(200).json({
            success: true,
            is_member: isMember,
            status: status 
        });

    } catch (error) {
        // API hatası (Örn: Geçersiz ID veya kullanıcı kanalda değil)
        // Bu, genellikle kullanıcı üye olmadığında da '400 Bad Request' olarak dönebilir.
         // Unity'nin hata almaması için 200 gönderip false döndürüyoruz.
        return res.status(200).json({
            success: false,
            is_member: false,
            error_message: 'API çağrısı başarısız oldu veya kullanıcı üye değil.'
        });
    }
};
