import fetch from 'node-fetch';

export default async function handler(req, res) {
    // Mengatur Header CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let bodyData = {};
    if (req.method === 'POST') {
        try {
            bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (e) {
            bodyData = req.body || {};
        }
    }

    const type = bodyData.type || req.query.type;
    const query = bodyData.query || req.query.query;
    const messages = bodyData.messages;

    // ROUTER 1: SYSTEM PENCARIAN GAMBAR WAIFU (PINTEREST VIA TERMAI)
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

    // ROUTER 2: AI CHAT ASSISTANT (GROQ SYSTEM RESMI)
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
            content: "Kamu adalah Mizu AI, sebuah asisten kecerdasan buatan terenkripsi yang berjalan di jaringan Mizu Core System. Kamu adalah pakar mutlak di bidang anime, manga, kultur pop Jepang, dan waifu populer (termasuk Arisu Sakayanagi, Hutao, dll). Gaya bicaramu santai, sangat ramah, cerdas, dan sedikit menggunakan estetika sistem komputer masa depan. Kamu HANYA diperbolehkan menjawab pertanyaan seputar anime, manga, dan waifu. Jika ada topik di luar itu, tolak secara halus dan arahkan kembali pengguna untuk membahas waifu."
        };

        // Bersihkan array pesan agar sesuai dengan format standar OpenAI/Groq API
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
                    model: "llama-3.3-70b-versatile", 
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const aiReply = data.choices[0].message.content;
                return res.status(200).json({ status: true, data: aiReply });
            } else {
                return res.status(500).json({ status: false, message: "Groq API Error", details: data });
            }
        } catch (error) {
            return res.status(500).json({ status: false, message: "Failed to connect to Groq Cloud Network" });
        }
    }

    return res.status(400).json({ status: false, message: "Invalid Request Type" });
            }
