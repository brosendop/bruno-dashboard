export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  try {
    const today = new Date().toLocaleDateString('pt-PT', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-2025-03-05' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, tools: [{ type: 'web_search_20250305', name: 'web_search' }], system: 'Responde APENAS com JSON array de noticias. Sem texto extra. Formato: [{"titulo":"...","descricao":"...","categoria":"mundo","fonte":"...","tempo":"ha X horas"}]. Categorias: mundo, geopolitica, portugal. Total 9-12 noticias.', messages: [{ role: 'user', content: 'Noticias mais importantes de hoje ' + today + '. So o array JSON.' }] })
    });
    const data = await response.json();
    const fullText = (data.content || []).map(b => b.text || '').join('');
    const s = fullText.indexOf('['), e = fullText.lastIndexOf(']');
    if (s === -1 || e === -1) return res.status(500).json({ error: 'No JSON', raw: fullText.slice(0,300) });
    const noticias = JSON.parse(fullText.slice(s, e+1));
    return res.status(200).json({ noticias });
  } catch(err) { return res.status(500).json({ error: err.message }); }
}
