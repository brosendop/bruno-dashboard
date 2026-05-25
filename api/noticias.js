export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'API key not configured' });
  try {
    const today = new Date().toLocaleDateString('pt-PT', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-2025-03-05' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, tools: [{ type: 'web_search_20250305', name: 'web_search' }], system: 'Responde APENAS com JSON array. Formato: [{"titulo":"...","descricao":"...","categoria":"mundo","fonte":"...","tempo":"ha X horas"}]. Categorias: mundo, geopolitica, portugal. Total 9-12 noticias.', messages: [{ role: 'user', content: 'Noticias importantes de hoje ' + today }] })
    });
    const data = await r.json();
    const txt = (data.content || []).map(b => b.text || '').join('');
    const s = txt.indexOf('['), e = txt.lastIndexOf(']');
    if (s === -1) return res.status(500).json({ error: 'No JSON', raw: txt.slice(0,300) });
    return res.status(200).json({ noticias: JSON.parse(txt.slice(s, e+1)) });
  } catch(err) { return res.status(500).json({ error: err.message }); }
}
