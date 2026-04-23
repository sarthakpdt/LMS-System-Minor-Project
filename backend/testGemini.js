/**
 * Run this in your backend folder to diagnose the Gemini issue:
 *   node testGemini.js
 */

require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function run() {
  console.log('\n========== GEMINI DIAGNOSTIC ==========\n');

  // Step 1: Check key exists
  if (!API_KEY || API_KEY === '' || API_KEY.trim() === '') {
    console.error(' GEMINI_API_KEY is missing or still set to placeholder in your .env file.');
    console.log('\nFix: Open your .env file and set:\n  GEMINI_API_KEY=AIzaSy...\n');
    console.log('Get a free key at: https://aistudio.google.com/app/apikey\n');
    process.exit(1);
  }

  console.log(' Key found:', API_KEY.slice(0, 8) + '...' + API_KEY.slice(-4));
  console.log('   Key length:', API_KEY.length, '(should be ~39 chars)\n');

  if (API_KEY.length < 30) {
    console.error('❌ Key looks too short — it may be truncated in your .env file.');
    process.exit(1);
  }

  // Step 2: List available models
  console.log('--- Step 1: Listing available models ---');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    const data = await res.json();

    if (data.error) {
      console.error('❌ API Error:', data.error.status, '-', data.error.message);
      if (data.error.status === 'PERMISSION_DENIED') {
        console.log('\nFix: Your API key is invalid or was deleted.');
        console.log('Generate a new one at: https://aistudio.google.com/app/apikey\n');
      }
      if (data.error.status === 'RESOURCE_EXHAUSTED') {
        console.log('\nFix: You have hit your free quota. Wait 1 minute or upgrade your plan.\n');
      }
      process.exit(1);
    }

    const models = (data.models || [])
      .filter(m => m.name.includes('gemini'))
      .map(m => m.name.replace('models/', ''));

    console.log(' Available Gemini models:');
    models.forEach(m => console.log('   -', m));
    console.log();
  } catch (e) {
    console.error('❌ Network error reaching Google API:', e.message);
    console.log('\nFix: Check your internet connection / firewall / proxy.\n');
    process.exit(1);
  }

  // Step 3: Try a real generation
  console.log('--- Step 2: Test generation with gemini-2.5-flash ---');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say "hello" in JSON: {"message":"hello"}' }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 50 },
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      console.error('❌ Generation error:', data.error.status, '-', data.error.message);

      const fixes = {
        PERMISSION_DENIED: 'Your key is invalid. Get a new one at https://aistudio.google.com/app/apikey',
        RESOURCE_EXHAUSTED: 'Quota exceeded. Wait 60 seconds or check https://aistudio.google.com/plan',
        INVALID_ARGUMENT:   'Bad request format.',
        NOT_FOUND:          'Model not found. Check model name.',
      };
      const fix = fixes[data.error.status];
      if (fix) console.log('\nFix:', fix);
      process.exit(1);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      console.log('✅ Generation works! Response:', text.trim());
    } else {
      console.warn('⚠️  Got a response but no text. Full response:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('❌ Fetch error:', e.message);
    process.exit(1);
  }

  console.log('\n========== ALL GOOD — Gemini is working! ==========\n');
  console.log('If your app still fails, restart your backend server:\n  npm run dev\n');
}

run();