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
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `És um assistente de briefing. Hoje é ${today}. Pesquisa notícias e responde APENAS com JSON array. Sem texto extra. Sem markdown. Sem backticks.
Formato: [{"titulo":"...","descricao":"...","categoria":"mundo","fonte":"...","tempo":"há X horas"},...]
Categorias possíveis: mundo, geopolitica, portugal
Inclui 9 a 12 notícias no total.`,
        messages: [{ role: 'user', content: `Notícias mais importantes de hoje ${today}. Responde só com o array JSON.` }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `API error ${response.status}: ${errText}` });
    }

    const data = await response.json();
    
    // Extrai todo o texto da resposta
    let fullText = '';
    if (data.content && Array.isArray(data.content)) {
      fullText = data.content.map(b => b.text || '').join('');
    }

    // Encontra o array JSON
    const startIdx = fullText.indexOf('[');
    const endIdx = fullText.lastIndexOf(']');
    
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return res.status(500).json({ 
        error: 'No JSON array in response', 
        raw: fullText.slice(0, 500) 
      });
    }

    const jsonStr = fullText.slice(startIdx, endIdx + 1);
    const noticias = JSON.parse(jsonStr);
    
    if (!Array.isArray(noticias)) {
      return res.status(500).json({ error: 'Response is not an array' });
    }

    return res.status(200).json({ noticias });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
