const fs = require('fs');
(async () => {
  try {
    const s = fs.readFileSync('.env.local', 'utf8');
    const env = {};
    s.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    });

    const token = env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const chat = env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
    if (!token || !chat) {
      console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
      process.exit(2);
    }

    console.log('Using token prefix:', token.slice(0, 20) + '...');

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: 'Test: Heloci bot is live (repo test)', parse_mode: 'HTML' })
    });

    const json = await res.json();
    console.log('HTTP', res.status);
    console.log(JSON.stringify(json, null, 2));
    if (!json.ok) process.exit(1);
  } catch (e) {
    console.error('Send failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
