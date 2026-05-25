export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const today = new Date().toLocaleDateString('pt-PT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `És um assistente de briefing de notícias para um executivo português. Hoje é ${today}.
Pesquisa as notícias mais importantes do dia e responde APENAS com um array JSON válido, sem texto antes ou depois, sem backticks, sem markdown.
Formato exacto: [{"titulo":"...","descricao":"...","categoria":"mundo|geopolitica|portugal","fonte":"...","tempo":"há X horas"}]
Inclui:
- 3-4 notícias categoria "mundo" (eventos globais importantes)
- 3-4 notícias categoria "geopolitica" (conflitos, diplomacia, tensões)
- 3-4 notícias categoria "portugal" (Portugal e Europa, economia, política)
Total: 9-12 notícias. Prioriza: conflitos ativos, eleições, decisões económicas, Portugal/Europa.
IMPORTANTE: Responde APENAS com o array JSON. Nenhum texto adicional.`,
        messages: [{
          role: 'user',
          content: `Pesquisa e devolve as notícias mais importantes de hoje, ${today}, no formato JSON pedido.`
        }]
      })
    });

    const data = await response.json();
    const fullText = data.content.map(b => b.text || '').join('');
    const startIdx = fullText.indexOf('[');
    const endIdx = fullText.lastIndexOf(']');
    if (startIdx === -1 || endIdx === -1) throw new Error('No JSON array found');
    const noticias = JSON.parse(fullText.slice(startIdx, endIdx + 1));
    res.status(200).json({ noticias });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
