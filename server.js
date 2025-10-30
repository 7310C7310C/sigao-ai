const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// POST /api/stream
// Accepts a JSON body similar to the Magisterium request body (model, messages, ...)
// Proxies the request to Magisterium with stream=true and forwards raw chunks to the client
app.post('/api/stream', async (req, res) => {
  const apiKey = process.env.MAGISTERIUM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'MAGISTERIUM_API_KEY not set in environment' });
  }

  const payload = Object.assign({}, req.body, { stream: true });

  try {
    const upstream = await fetch('https://www.magisterium.com/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).send(text);
    }

    // Stream processing: parse SSE / JSONL style from upstream and forward only
    // human-readable text (choices delta / message content). Also surface
    // citations and related_questions as labeled blocks.
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = upstream.body;
    let buffer = '';

    function flushText(text) {
      try { res.write(text); } catch (e) {}
    }

    function handleDataFrame(frame) {
      // frame may be like 'data: {...}\n' or raw JSON
      const lines = frame.split('\n');
      // gather data: lines (SSE)
      const dataLines = lines.map(l => (l.startsWith('data:') ? l.replace(/^data:\s*/, '') : l)).filter(Boolean);
      if (dataLines.length === 0) return;
      const data = dataLines.join('\n').trim();
      if (!data) return;
      if (data === '[DONE]') {
        // finish
        try { res.end(); } catch (e) {}
        return;
      }

      // Try parse JSON, otherwise write raw
      try {
        const obj = JSON.parse(data);
        // Prefer incremental delta content
        const choice = (obj.choices && obj.choices[0]) || null;
        let text = '';
        if (choice) {
          // streaming delta format
          if (choice.delta && choice.delta.content) {
            text = choice.delta.content;
          } else if (choice.message && choice.message.content) {
            text = choice.message.content;
          }
        }
        if (text) {
          flushText(text);
          return;
        }

        // Non-text fields: citations / related_questions
        if (obj.citations) {
          flushText('\n[CITATIONS]\n' + JSON.stringify(obj.citations, null, 2) + '\n');
          return;
        }
        if (obj.related_questions) {
          flushText('\n[RELATED_QUESTIONS]\n' + JSON.stringify(obj.related_questions, null, 2) + '\n');
          return;
        }

        // fallback: if object contains text-like fields, attempt to extract
        if (obj.text) {
          flushText(obj.text);
          return;
        }

        // otherwise write a compact representation
        flushText('\n[RAW_JSON]\n' + JSON.stringify(obj) + '\n');
      } catch (err) {
        // not JSON — just forward trimmed data
        flushText(data);
      }
    }

    stream.on('data', (chunk) => {
      try {
        buffer += chunk.toString('utf8');
        // SSE-style frames are separated by double newlines
        let parts = buffer.split('\n\n');
        // keep last partial in buffer
        buffer = parts.pop();
        for (const part of parts) {
          handleDataFrame(part);
        }
      } catch (err) {
        console.error('Stream data handling error:', err);
      }
    });

    stream.on('end', () => {
      // process any remaining buffer
      if (buffer) handleDataFrame(buffer);
      try { res.end(); } catch (e) {}
    });

    stream.on('error', (err) => {
      console.error('Upstream stream error:', err);
      try { res.end(); } catch (e) {}
    });

  } catch (err) {
    console.error('Request error:', err);
    res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Magisterium PoC server listening on ${port}`));
