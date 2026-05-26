export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  const { type, eventos } = req.body || {};

  try {
    const today = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    let prompt, system;

    if (type === 'secretaria') {
      system = 'Es uma secretaria executiva portuguesa. Analisa os eventos e tarefas fornecidos e devolve APENAS um JSON valido sem texto extra nem markdown. Formato: {"hoje":["..."],"semana":["..."],"alertas":["..."],"foco":"mensagem curta de foco do dia"}';
      prompt = 'Hoje e ' + today + '. Analisa estes eventos e tarefas:\n\n' + eventos + '\n\nOrganiza em: hoje (o que e urgente hoje), semana (proximos 7 dias), alertas (coisas com prazo a aproximar-se), foco (uma frase motivacional sobre o que focar hoje). Devolve so o JSON.';
    } else {
      system = 'Es um assistente de noticias. Devolve APENAS um array JSON valido sem texto extra nem markdown. Formato: [{"titulo":"...","descricao":"...","categoria":"mundo","fonte":"..."}]';
      prompt = 'Hoje e ' + today + '. Lista as 12 noticias mais importantes do mundo hoje: 4 de categoria "mundo", 4 de "geopolitica", 4 de "portugal". Devolve so o array JSON.';
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: 'API ' + r.status + ': ' + t.slice(0, 200) });
    }

    const data = await r.json();
    const txt = (data.content || []).map(function(b) { return b.text || ''; }).join('');

    // Extract JSON
    const isArray = type !== 'secretaria';
    const open = isArray ? '[' : '{';
    const close = isArray ? ']' : '}';
    const s = txt.indexOf(open);
    const e = txt.lastIndexOf(close);

    if (s === -1 || e === -1) {
      return res.status(500).json({ error: 'No JSON in response', raw: txt.slice(0, 300) });
    }

    const parsed = JSON.parse(txt.slice(s, e + 1));
    return res.status(200).json({ result: parsed });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
