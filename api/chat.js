export default async function handler(req, res) {
    // Mengizinkan CORS dasar
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ status: false, message: "Query parameter is required" });
    }

    // Ambil API Key dari Environment Variable Vercel (Lebih aman)
    // Jika belum disetting di Vercel, dia akan fallback ke string 'YOUR_APIKEY' di bawah
    const apiKey = process.env.XTERM_API_KEY || "YOUR_APIKEY"; 
    const apiUrl = `https://api.termai.cc/api/search/pinterest-image?query=${encodeURIComponent(query)}&key=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal Server Error Node Database" });
    }
          }
