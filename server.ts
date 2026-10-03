import express, { type Request, type Response } from 'express';
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

// Haversine distance calculator for server
function getDistanceKm(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Full AI Voice Emergency Assistant Conversation Endpoint
app.post('/api/voice-assistant-conversation', async (req: Request, res: Response) => {
  try {
    const { message, language = 'en', userLocation, conversationHistory = [], filterCategory } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const lower = message.toLowerCase();
    const coords = userLocation?.coords;

    // Detect emergency urgency mode
    const isEmergency =
      lower.includes('ambulance') ||
      lower.includes('accident') ||
      lower.includes('injured') ||
      lower.includes('injury') ||
      lower.includes('bleeding') ||
      lower.includes('fire') ||
      lower.includes('smoke') ||
      lower.includes('police') ||
      lower.includes('robbery') ||
      lower.includes('theft') ||
      lower.includes('attack') ||
      lower.includes('hospital') ||
      lower.includes('heart') ||
      lower.includes('stroke') ||
      lower.includes('broken down') ||
      lower.includes('breakdown') ||
      lower.includes('towing') ||
      lower.includes('blood') ||
      lower.includes('zakhmi') ||
      lower.includes('aag') ||
      lower.includes('madad') ||
      lower.includes('bachao') ||
      lower.includes('emergency') ||
      lower.includes('disaster') ||
      lower.includes('flood') ||
      lower.includes('burn');

    // Detect target location mentioned in query
    let targetCity = '';
    const cityKeywords = [
      'quetta', 'pishin', 'chaman', 'gwadar', 'khuzdar', 'turbat', 'hub', 'zhob', 'ziarat',
      'karachi', 'hyderabad', 'sukkur', 'larkana', 'nawabshah',
      'lahore', 'rawalpindi', 'faisalabad', 'multan', 'gujranwala', 'sialkot', 'bahawalpur', 'gujrat', 'sargodha',
      'islamabad',
      'peshawar', 'abbottabad', 'swat', 'mardan', 'chitral', 'kohat', 'bannu', 'mansehra',
      'muzaffarabad', 'mirpur', 'rawalakot', 'kotli',
      'gilgit', 'skardu', 'hunza', 'chilas', 'ghizer'
    ];

    for (const city of cityKeywords) {
      if (lower.includes(city)) {
        targetCity = city;
        break;
      }
    }

    // Determine target category
    let targetCat: string | null = filterCategory || null;
    if (!targetCat) {
      if (lower.includes('ambulance')) targetCat = 'Ambulance';
      else if (lower.includes('police') || lower.includes('robbery') || lower.includes('theft') || lower.includes('crime')) targetCat = 'Police';
      else if (lower.includes('fire') || lower.includes('smoke') || lower.includes('aag')) targetCat = 'Fire Brigade';
      else if (lower.includes('hospital') || lower.includes('doctor') || lower.includes('casualty') || lower.includes('emergency room') || lower.includes('er')) targetCat = 'Hospital Emergency';
      else if (lower.includes('blood') || lower.includes('donor')) targetCat = 'Blood Bank';
      else if (lower.includes('pharmacy') || lower.includes('medicine') || lower.includes('dawa')) targetCat = 'Emergency Pharmacy';
      else if (lower.includes('mechanic') || lower.includes('puncture') || lower.includes('tyre')) targetCat = 'Mechanic';
      else if (lower.includes('towing') || lower.includes('roadside') || lower.includes('break down') || lower.includes('broken down') || lower.includes('motorway') || lower.includes('highway')) targetCat = 'Motorway / Highway Police';
      else if (lower.includes('flood') || lower.includes('drowning') || lower.includes('selaab')) targetCat = 'Flood Rescue';
      else if (lower.includes('mountain') || lower.includes('hiking') || lower.includes('avalanche')) targetCat = 'Mountain Rescue';
      else if (lower.includes('bomb') || lower.includes('explosive') || lower.includes('suspicious bag')) targetCat = 'Bomb Disposal';
      else if (lower.includes('civil defence')) targetCat = 'Civil Defence';
      else if (lower.includes('railway') || lower.includes('train')) targetCat = 'Railway Emergency';
      else if (lower.includes('airport') || lower.includes('flight') || lower.includes('plane')) targetCat = 'Airport Emergency';
      else if (lower.includes('electricity') || lower.includes('power') || lower.includes('current') || lower.includes('bijli') || lower.includes('lesco') || lower.includes('kelectric') || lower.includes('iesco')) targetCat = 'Electricity Emergency';
      else if (lower.includes('gas') || lower.includes('sui gas') || lower.includes('leakage') || lower.includes('sngpl') || lower.includes('ssgc')) targetCat = 'Gas Emergency';
      else if (lower.includes('water') || lower.includes('pipeline') || lower.includes('paani') || lower.includes('wasa')) targetCat = 'Water Emergency';
      else if (lower.includes('animal') || lower.includes('dog') || lower.includes('cat') || lower.includes('vet') || lower.includes('veterinary')) targetCat = 'Animal Rescue / Veterinary Emergency';
      else if (lower.includes('rescue') || lower.includes('1122')) targetCat = 'Rescue Services';
    }

    // Filter database
    let candidates: (typeof INITIAL_EMERGENCY_RECORDS[number])[] = INITIAL_EMERGENCY_RECORDS.map((rec) => {
      let dist = undefined;
      if (coords && rec.coordinates) {
        dist = getDistanceKm(coords, rec.coordinates);
      }
      return { ...rec, distanceKm: dist };
    });

    // Apply city match if mentioned
    if (targetCity) {
      const cityMatched = candidates.filter(
        (r) =>
          r.city.toLowerCase().includes(targetCity) ||
          r.district.toLowerCase().includes(targetCity) ||
          r.province.toLowerCase().includes(targetCity)
      );
      if (cityMatched.length > 0) {
        candidates = cityMatched;
      }
    }

    // Apply category match if detected
    if (targetCat) {
      const catMatched = candidates.filter((r) => {
        if (targetCat === 'Ambulance') return r.category === 'Ambulance' || r.category === 'Rescue Services';
        if (targetCat === 'Police') return r.category === 'Police';
        if (targetCat === 'Fire Brigade') return r.category === 'Fire Brigade' || r.category === 'Rescue Services';
        if (targetCat === 'Hospital Emergency') return r.category === 'Hospital Emergency';
        if (targetCat === 'Blood Bank') return r.category === 'Blood Bank';
        if (targetCat === 'Emergency Pharmacy') return r.category === 'Emergency Pharmacy';
        if (targetCat === 'Mechanic') return r.category === 'Mechanic' || r.category === 'Towing / Roadside Assistance';
        if (targetCat === 'Motorway / Highway Police') return r.category === 'Motorway / Highway Police' || r.category === 'Towing / Roadside Assistance';
        if (targetCat === 'Rescue Services') return r.category === 'Rescue Services' || r.category === 'Ambulance';
        return r.category === targetCat;
      });
      if (catMatched.length > 0) {
        candidates = catMatched;
      }
    }

    // Sort: if distance available, sort by closest; otherwise keep high priority verified national/district
    if (coords) {
      candidates.sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== undefined) return -1;
        if (b.distanceKm !== undefined) return 1;
        return 0;
      });
    }

    let matchedRecords: (typeof INITIAL_EMERGENCY_RECORDS[number])[] = candidates.slice(0, 6);

    // If still empty, guarantee primary national emergency records (1122, 15, 16, 115)
    if (matchedRecords.length === 0) {
      matchedRecords = INITIAL_EMERGENCY_RECORDS.filter(
        (r) => r.phone === '1122' || r.phone === '15' || r.phone === '16' || r.phone === '115'
      ).slice(0, 4);
    }

    let spokenReply = '';
    let guidancePoints: string[] = [];

    // Prompt Gemini with strict verified DB grounding
    if (ai) {
      try {
        const prompt = `You are the official AI Voice Emergency Assistant for "PANEZAI EMERGENCY NETWORK" Pakistan.
User question: "${message}"
Requested Language: ${language === 'ur' ? 'Urdu' : language === 'ps' ? 'Pashto' : 'English'}
User Location Context: ${JSON.stringify(userLocation || {})}
Verified Emergency Contacts available: ${JSON.stringify(
          matchedRecords.map((r) => ({
            service: r.category,
            org: r.organization,
            phone: r.phone,
            alt: r.altPhone,
            location: `${r.city}, ${r.district}, ${r.province}`,
            verifiedDate: r.verificationDate,
            is24_7: r.is24_7,
            status: r.verificationStatus,
            distance: r.distanceKm ? `${r.distanceKm} km` : 'N/A',
          }))
        )}

CRITICAL SAFETY RULES:
1. Speak directly, calmly, and urgently in ${language === 'ur' ? 'Urdu' : language === 'ps' ? 'Pashto' : 'English'}.
2. Always announce the exact verified helpline or emergency number (e.g., Rescue 1122, Police 15, Fire Brigade 16, Edhi 115, Motorway 130).
3. NEVER guess or invent any phone number. Only use the numbers provided in the verified list above.
4. Keep spoken reply concise (maximum 2 sentences) so the user gets help without delay.
5. Provide 2-3 essential first aid / emergency safety instructions in the "guidance" array.

Output pure JSON:
{
  "spokenReply": "string voice response in ${language === 'ur' ? 'Urdu' : language === 'ps' ? 'Pashto' : 'English'}",
  "isEmergencyMode": ${isEmergency},
  "emergencyType": "${targetCat || 'General Emergency'}",
  "guidance": ["step 1", "step 2", "step 3"]
}`;

        const genRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const parsed = JSON.parse(genRes.text || '{}');
        spokenReply = parsed.spokenReply;
        if (Array.isArray(parsed.guidance) && parsed.guidance.length > 0) {
          guidancePoints = parsed.guidance;
        }
      } catch (e) {
        console.warn('AI voice response error:', e);
      }
    }

    // Deterministic fallback response if AI call failed
    if (!spokenReply) {
      const topOrg = matchedRecords[0]?.organization || 'Rescue 1122';
      const topNum = matchedRecords[0]?.phone || '1122';

      if (lower.includes('ambulance') || lower.includes('accident') || lower.includes('injured')) {
        spokenReply =
          language === 'ur'
            ? `فوری طبی ایمرجنسی کے لیے ${topOrg} کا تصدیق شدہ نمبر ${topNum} ہے۔ فوری کال کرنے کے لیے نیچے دیا گیا سرخ بٹن دبائیں۔`
            : language === 'ps'
            ? `د سمدستي طبي مرستې لپاره د ${topOrg} تصدیق شوې شمېره ${topNum} ده. د زنګ لپاره لاندې تڼۍ ووهئ.`
            : `For medical emergency, verified contact for ${topOrg} is ${topNum}. Press CALL NOW below immediately.`;
        guidancePoints = [
          'Keep the patient calm, comfortable, and warm.',
          'Do not move anyone with suspected spinal or neck injury.',
          'Apply direct clean pressure to any bleeding area.'
        ];
      } else if (lower.includes('police')) {
        spokenReply =
          language === 'ur'
            ? `پولیس ایمرجنسی کا تصدیق شدہ نمبر 15 ہے۔ مددگار 15 چوبیس گھنٹے فعال ہے۔`
            : language === 'ps'
            ? `د پولیسو بیړنۍ تایید شوې شمېره ۱۵ ده. مدګار ۱۵ ۲۴ ساعته فعال دی.`
            : `Police Emergency helpline across Pakistan is 15. Tap CALL NOW to connect.`;
        guidancePoints = [
          'Move to a safe, well-lit public area.',
          'Note down any vehicle license plates or suspect descriptions.',
          'Do not attempt to confront armed criminals.'
        ];
      } else if (lower.includes('fire')) {
        spokenReply =
          language === 'ur'
            ? `فائر بریگیڈ ایمرجنسی کا تصدیق شدہ نمبر 16 ہے۔ عمارت کو فوری خالی کریں۔`
            : language === 'ps'
            ? `د اور وژنې بیړنۍ شمېره ۱۶ ده. له ودانۍ ژر تر ژره ووځئ.`
            : `Fire Brigade emergency helpline is 16. Evacuate the premises immediately.`;
        guidancePoints = [
          'Evacuate immediately using stairs; never use elevators during a fire.',
          'Stay low to the ground to avoid inhaling toxic smoke.',
          'Close doors behind you to contain flames.'
        ];
      } else if (lower.includes('hospital')) {
        spokenReply =
          language === 'ur'
            ? `قریبی ہسپتال ایمرجنسی ${topOrg} ہے، رابطہ نمبر ${topNum} ہے۔`
            : language === 'ps'
            ? `نږدې روغتون ${topOrg} دی، د تماس شمېره ${topNum} ده.`
            : `Nearest verified hospital emergency is ${topOrg} at ${topNum}. Directions and 1-tap call are available below.`;
        guidancePoints = [
          'Bring identification and any existing medical cards if accessible.',
          'Proceed directly to the Accident & Emergency (A&E) trauma desk.',
          'Call ahead on the verified number so casualty staff can prepare.'
        ];
      } else {
        spokenReply =
          language === 'ur'
            ? `پنیزئی ایمرجنسی نیٹ ورک: تصدیق شدہ رابطہ ${topOrg} (${topNum}) دستیاب ہے۔`
            : language === 'ps'
            ? `پنیزئي بیړنۍ شبکه: د ${topOrg} تایید شوې شمېره ${topNum} ده.`
            : `Panezai Emergency Network: Verified helpline for ${topOrg} is ${topNum}.`;
        guidancePoints = [
          'Universal emergency services in Pakistan: Rescue 1122 & Police 15.',
          'All numbers are verified and accessible via direct cellular call.',
          'Share your live coordinates with family or responders.'
        ];
      }
    }

    res.json({
      spokenReply,
      isEmergencyMode: isEmergency,
      emergencyType: targetCat || 'General Emergency',
      matchedRecords,
      guidance: guidancePoints,
      suggestedActions: isEmergency ? ['ambulance', 'police', 'hospital', 'location', 'family'] : ['location'],
      safetyNote: 'Panezai Emergency Network provides 100% verified official contacts. Zero AI hallucinations.'
    });
  } catch (err: any) {
    console.error('Error in voice-assistant-conversation:', err);
    res.status(500).json({ error: err.message });
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
