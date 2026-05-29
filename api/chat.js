export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { type, query, messages } = req.body;

    // ROUTER 1: PENCARIAN GAMBAR (Tetap lewat Termai)
    if (type === 'search' || req.method === 'GET') {
        const searchQuery = query || req.query.query;
        if (!searchQuery) return res.status(400).json({ status: false, message: "Query required" });

        const xtermKey = process.env.XTERM_API_KEY || "YOUR_APIKEY";
        try {
            const response = await fetch(`https://api.termai.cc/api/search/pinterest-image?query=${encodeURIComponent(searchQuery)}&key=${xtermKey}`);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ status: false, message: "Database Error" });
        }
    }

    // ROUTER 2: AI CHAT ASSISTANT (Langsung menggunakan API Resmi Groq)
    if (type === 'chat' && req.method === 'POST') {
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ status: false, message: "Messages array required" });
        }

        // Ambil API Key Groq dari Environment Variable Vercel
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!groqApiKey) {
            return res.status(500).json({ status: false, message: "Groq API Key is not configured on Vercel" });
        }

        const systemPrompt = {
            role: "system",
            content: "Kamu adalah Mizu AI, seorang asisten ahli yang sangat populer di bidang anime, manga, pop-culture Jepang, dan waifu. Gaya bicaramu santai, ramah, dan sedikit menggunakan estetika komputer masa depan. Kamu HANYA boleh menjawab pertanyaan seputar anime, manga, karakter fiksi (waifu/husbando), dan kultur jejepangan. Jika pengguna bertanya di luar topik tersebut, tolaklah dengan sopan dan alihkan kembali ke pembahasan waifu."
        };

        try {
            // Menembak langsung ke Endpoint Resmi Groq Cloud API
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [systemPrompt, ...messages],
                    model: "llama3-70b-8192", // Kamu bisa ganti ke llama3-8b-8192 atau mixtral-8x7b-32768 jika mau
                    temperature: 0.7
                })
            });

            const data = await response.json();
            
            // Mengambil teks balasan dari struktur data response OpenAI/Groq standard
            const aiReply = data.choices[0].message.content;
            
            return res.status(200).json({ status: true, data: aiReply });
        } catch (error) {
            return res.status(500).json({ status: false, message: "Groq AI Node Connection Lost" });
        }
    }

    return res.status(400).json({ status: false, message: "Invalid Request Type" });
            }
