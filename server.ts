import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_EMERGENCY_RECORDS } from './src/data/emergencyDatabase.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK with required telemetry User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Emergency Assistant endpoint
app.post('/api/assistant', async (req: Request, res: Response) => {
  try {
    const { query, userLocation, language = 'en' } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query is required.' });
      return;
    }

    // Safety rule prompt & database grounding
    const dbSummary = INITIAL_EMERGENCY_RECORDS.map((r) => ({
      city: r.city,
      district: r.district,
      province: r.province,
      category: r.category,
      organization: r.organization,
      phone: r.phone,
      altPhone: r.altPhone || '',
      is24_7: r.is24_7,
      status: r.verificationStatus,
      source: r.officialSource,
    }));

    if (!ai) {
      // Deterministic offline search fallback
      const qLower = query.toLowerCase();
      const matched = INITIAL_EMERGENCY_RECORDS.filter(
        (r) =>
          r.city.toLowerCase().includes(qLower) ||
          r.district.toLowerCase().includes(qLower) ||
          r.province.toLowerCase().includes(qLower) ||
          r.organization.toLowerCase().includes(qLower) ||
          r.category.toLowerCase().includes(qLower) ||
          r.phone.includes(qLower)
      ).slice(0, 5);

      if (matched.length > 0) {
        const text = matched
          .map(
            (m) =>
              `• **${m.organization}** (${m.city}, ${m.province})\n  📞 **${m.phone}** ${m.altPhone ? `| Alt: ${m.altPhone}` : ''}\n  Category: ${m.category} | 24/7: ${m.is24_7 ? 'Yes' : 'No'} | Status: ${m.verificationStatus} (Source: ${m.officialSource})`
          )
          .join('\n\n');
        res.json({
          reply: `Here are the verified emergency numbers from the official Pakistan database:\n\n${text}`,
          source: 'local_verified_db',
        });
        return;
      }

      res.json({
        reply: `Verified emergency number currently unavailable for this specific query. For immediate life-safety emergencies anywhere in Pakistan, please dial **Rescue 1122** or **Police 15**.`,
        source: 'local_safety_rule',
      });
      return;
    }

    const systemInstruction = `You are the official PANEZAI EMERGENCY NETWORK Assistant for Pakistan.
CRITICAL SAFETY RULES:
1. You must ONLY retrieve emergency numbers from the provided verified database context.
2. ABSOLUTE RULE: You must NEVER invent, guess, autocomplete, or estimate a phone number.
3. If a verified number does not exist in the database for the user's requested location or category, state clearly: "Verified emergency number currently unavailable for this location. Please dial universal national emergency Rescue 1122 or Police 15."
4. Always list the Organization Name, Verified Phone Number, 24/7 status, Location, and Official Source.
5. Answer in the user's requested language (${language === 'ur' ? 'Urdu' : language === 'ps' ? 'Pashto' : 'English'}). Keep responses concise, calm, clear, and focused on urgent safety.`;

    const userPrompt = `User Query: "${query}"
User Location Context: ${userLocation ? JSON.stringify(userLocation) : 'Not specified'}

VERIFIED PAKISTAN DATABASE:
${JSON.stringify(dbSummary, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.1, // Low temperature for high factual accuracy
      },
    });

    const reply = response.text || 'Verified emergency number currently unavailable.';
    res.json({ reply, source: 'gemini_verified' });
  } catch (err: any) {
    console.error('Error in AI Assistant:', err);
    res.json({
      reply: 'Verified emergency numbers: Rescue 1122, Police 15, Fire Brigade 16, Edhi Ambulance 115, Motorway Police 130. Please dial these verified national helplines immediately if in danger.',
      source: 'safety_fallback',
    });
  }
});

// Emergency Voice Listener / Intake Analyzer endpoint
app.post('/api/emergency-listen', async (req: Request, res: Response) => {
  try {
    const { speechText, language = 'en', userLocation } = req.body;
    if (!speechText) {
      res.status(400).json({ error: 'Speech text is required.' });
      return;
    }

    const lower = speechText.toLowerCase();

    // Default fast heuristic match
    let detectedCategory = 'Ambulance';
    let recommendedNumber = '1122';
    let recommendedService = 'Rescue 1122 Ambulance & Emergency';
    let detectedUrgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'HIGH';

    if (lower.includes('police') || lower.includes('theft') || lower.includes('robbery') || lower.includes('crime') || lower.includes('fight')) {
      detectedCategory = 'Police';
      recommendedNumber = '15';
      recommendedService = 'Police Emergency (Madadgar 15)';
    } else if (lower.includes('fire') || lower.includes('smoke') || lower.includes('aag') || lower.includes('blast')) {
      detectedCategory = 'Fire Brigade';
      recommendedNumber = '16';
      recommendedService = 'Fire Brigade Control 16';
      detectedUrgency = 'CRITICAL';
    } else if (lower.includes('blood') || lower.includes('khoon') || lower.includes('donor')) {
      detectedCategory = 'Blood Bank';
      recommendedNumber = '080000011';
      recommendedService = 'Pakistan Red Crescent Blood Bank';
    } else if (lower.includes('motorway') || lower.includes('highway') || lower.includes('car break') || lower.includes('puncture') || lower.includes('towing') || lower.includes('mechanic')) {
      detectedCategory = 'Motorway / Highway Police';
      recommendedNumber = '130';
      recommendedService = 'Motorway Police Helpline (NHMP 130)';
    }

    let spokenAdvice =
      language === 'ur'
        ? `آپ کی صورتحال درج کر لی گئی ہے۔ فوری طور پر ${recommendedService} پر رابطہ کیا جا رہا ہے۔ پرسکون رہیں اور کال کا بٹن دبائیں۔`
        : language === 'ps'
        ? `ستاسو بیړنی پیغام ثبت شو. سمدستي ${recommendedService} سره اړیکه نیول کیږي. مهرباني وکړئ آرامه اوسئ او زنګ ووهئ.`
        : `Your emergency has been recognized. Connecting you to ${recommendedService} on ${recommendedNumber}. Please stay calm, we are ready to dial.`;

    if (ai) {
      try {
        const prompt = `Analyze this spoken emergency narrative from Pakistan: "${speechText}"
Location context: ${JSON.stringify(userLocation || {})}
Language: ${language}

Output JSON with:
{
  "detectedUrgency": "CRITICAL" | "HIGH" | "MEDIUM",
  "detectedCategory": "Ambulance" | "Police" | "Fire Brigade" | "Hospital Emergency" | "Blood Bank" | "Mechanic" | "Motorway / Highway Police" | "Rescue Services",
  "recommendedNumber": "1122" | "15" | "16" | "115" | "130" | "117" | "1199",
  "recommendedService": "string name",
  "locationHint": "string city/area if detected",
  "spokenAdvice": "calm, concise 1-2 sentence reassuring instruction in ${language === 'ur' ? 'Urdu' : language === 'ps' ? 'Pashto' : 'English'}"
}`;
        const genRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const parsed = JSON.parse(genRes.text || '{}');
        res.json({
          originalSpeech: speechText,
          detectedUrgency: parsed.detectedUrgency || detectedUrgency,
          detectedCategory: parsed.detectedCategory || detectedCategory,
          recommendedNumber: parsed.recommendedNumber || recommendedNumber,
          recommendedService: parsed.recommendedService || recommendedService,
          locationHint: parsed.locationHint,
          spokenAdvice: parsed.spokenAdvice || spokenAdvice,
        });
        return;
      } catch (e) {
        console.warn('AI speech parsing fallback:', e);
      }
    }

    res.json({
      originalSpeech: speechText,
      detectedUrgency,
      detectedCategory,
      recommendedNumber,
      recommendedService,
      spokenAdvice,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Multi-turn Gemini Chat endpoint with conversation history
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages = [], language = 'en' } = req.body;
    if (!messages.length) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    if (!ai) {
      const lastMsg = messages[messages.length - 1]?.text || '';
      res.json({
        reply: `Emergency desk response to: "${lastMsg}". In all emergencies across Pakistan, dial Rescue 1122 or Police 15 directly. Both numbers work offline without internet.`,
      });
      return;
    }

    const systemInstruction = `You are the official 24/7 Emergency Dispatcher for PANEZAI EMERGENCY NETWORK Pakistan.
Role:
- Listen to citizen emergencies with empathy and instant clarity.
- Give safe, rapid first-aid or safety guidance while dispatching assistance.
- NEVER invent phone numbers; only use verified numbers (1122 Rescue/Fire, 15 Police, 16 Fire, 115 Edhi, 130 Motorway, 117 Railways, 1199 Gas).
- Respond in ${language === 'ur' ? 'Urdu' : language === 'ps' ? 'Pashto' : 'English'}. Keep responses concise and focused on immediate safety.`;

    const contents = messages.map((m: any) => ({
      role: m.sender === 'me' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    res.json({ reply: response.text || 'Understood. Please call Rescue 1122 or Police 15 immediately.' });
  } catch (err: any) {
    res.json({
      reply: 'Emergency connection standby. Dial Rescue 1122 or Police 15 directly from your cellular phone now.',
    });
  }
});

// Dev vs Production Setup
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🇵🇰 Panezai Emergency Network Server running on port ${PORT}`);
  });
}

startServer();
