export default async function handler(req, res) {
    // Mengatur Header CORS secara komprehensif
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Pendekatan parsing body yang aman baik dari form maupun json raw
    let bodyData = {};
    if (req.method === 'POST') {
        try {
            bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (e) {
            return res.status(400).json({ status: false, message: "Invalid JSON Body" });
        }
    }

    const type = bodyData.type || req.query.type;
    const query = bodyData.query || req.query.query;
    const messages = bodyData.messages;

    // ROUTER 1: SYSTEM PENCARIAN GAMBAR WAIFU
    if (type === 'search' || req.method === 'GET') {
        const searchQuery = query || req.query.query;
        if (!searchQuery) return res.status(400).json({ status: false, message: "Query required" });

        const xtermKey = process.env.XTERM_API_KEY || "YOUR_APIKEY";
        try {
            const response = await fetch(`https://api.termai.cc/api/search/pinterest-image?query=${encodeURIComponent(searchQuery)}&key=${xtermKey}`);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ status: false, message: "Image Node Database Error" });
        }
    }

    // ROUTER 2: AI CHAT ASSISTANT (GROQ SYSTEM)
    if (type === 'chat' && req.method === 'POST') {
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ status: false, message: "Messages array required" });
        }

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return res.status(500).json({ status: false, message: "GROQ_API_KEY is missing on Vercel Environment Variables" });
        }

        const systemPrompt = {
            role: "system",
            content: "Kamu adalah Mizu AI, seorang asisten ahli yang sangat populer di bidang anime, manga, pop-culture Jepang, dan waifu. Gaya bicaramu santai, ramah, dan sedikit menggunakan estetika komputer masa depan. Kamu HANYA boleh menjawab pertanyaan seputar anime, manga, karakter fiksi (waifu/husbando), dan kultur jejepangan. Jika pengguna bertanya di luar topik tersebut, tolaklah dengan sopan dan alihkan kembali ke pembahasan waifu."
        };

        // Bersihkan array pesan agar hanya menyisakan 'role' dan 'content' yang sah untuk standar OpenAI/Groq
        const cleanedMessages = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : (msg.role === 'system' ? 'system' : 'user'),
            content: String(msg.content)
        }));

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [systemPrompt, ...cleanedMessages],
                    model: "llama3-70b-8192", 
                    temperature: 0.7
                })
            });

            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const aiReply = data.choices[0].message.content;
                return res.status(200).json({ status: true, data: aiReply });
            } else {
                // Mengembalikan pesan error detail dari server Groq (jika kuota habis / salah key)
                return res.status(500).json({ status: false, data: "Groq API Error Response", raw: data });
            }
        } catch (error) {
            return res.status(500).json({ status: false, message: "Failed to connect to Groq Cloud Network" });
        }
    }

    return res.status(400).json({ status: false, message: "Invalid Request Type" });
                               }
