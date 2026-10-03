import type { EmergencyGuidanceTopic, SupportedLanguage } from '../types/emergency.ts';

export const EMERGENCY_GUIDANCE_TOPICS: EmergencyGuidanceTopic[] = [
  {
    id: 'road-accident',
    title: 'Road Traffic Accident Response',
    icon: '🚗',
    category: 'Traffic & Vehicle Emergency',
    summary: 'Immediate safety steps when involved in or witnessing a vehicle collision on Pakistan roads or highways.',
    immediateActions: [
      'Turn on hazard lights immediately to warn approaching vehicles.',
      'If on Motorway or Highway, move behind the safety barrier immediately.',
      'Check for unresponsive passengers or severe bleeding before moving anyone.',
      'Do not move seriously injured persons unless there is imminent risk of fire.',
      'Dial Rescue 1122 or Motorway Police 130 immediately.'
    ],
    whileWaiting: [
      'Place warning triangles or reflective cones 50 to 100 meters behind the vehicle.',
      'Apply direct, firm pressure with a clean cloth to any actively bleeding wound.',
      'Keep injured persons warm and speak calmly to keep them conscious.',
      'Never give water or food to an unconscious or heavily bleeding person.'
    ],
    whatToTellResponders: [
      'Exact road name, kilometer stone, or nearest landmark (e.g. M-2 Motorway Km 210 Southbound).',
      'Number of vehicles involved and approximate number of injured persons.',
      'Whether anyone is trapped inside the wreckage.',
      'Any fuel leakage, fire hazard, or power cable involvement.'
    ],
    safetyWarnings: [
      'Never stand between two damaged vehicles on a high-speed highway.',
      'Do not remove helmets from injured motorcyclists unless breathing is obstructed.'
    ],
    verifiedContact: {
      service: 'Rescue 1122 & Motorway Police',
      number: '1122'
    }
  },
  {
    id: 'fire-safety',
    title: 'Fire Emergency & Smoke Evacuation',
    icon: '🔥',
    category: 'Fire Brigade & Evacuation',
    summary: 'Critical steps to safely escape residential, commercial, or industrial fires.',
    immediateActions: [
      'Sound the alarm immediately and shout to alert everyone inside.',
      'Evacuate immediately via the nearest fire exit or stairway. NEVER use elevators.',
      'Feel closed doors with the back of your hand before opening. If hot, do not open.',
      'Crawl low under smoke — clean breathable air is closest to the floor (within 30 cm).',
      'Call Fire Brigade 16 or Rescue 1122 once outside in a safe assembly area.'
    ],
    whileWaiting: [
      'If trapped in a room, seal door cracks with wet cloth or tape to block toxic smoke.',
      'Signal from an exterior window with a bright cloth or phone flashlight.',
      'If your clothes catch fire: STOP, DROP to the ground, and ROLL back and forth.',
      'Do not re-enter the building for valuables under any circumstances.'
    ],
    whatToTellResponders: [
      'Exact building address, floor number, and cross streets.',
      'Whether people are trapped and on which floors/rooms.',
      'Presence of gas cylinders (LPG), chemical drums, or electrical substations.'
    ],
    safetyWarnings: [
      'Smoke inhalation and toxic carbon monoxide kill faster than flames. Protect your breathing airway.',
      'Do not use water on electrical or oil/grease fires — use dry chemical extinguisher or sand.'
    ],
    verifiedContact: {
      service: 'Fire Brigade Control',
      number: '16'
    }
  },
  {
    id: 'waiting-ambulance',
    title: 'While Waiting for the Ambulance',
    icon: '🚑',
    category: 'Medical First Aid',
    summary: 'Life-saving first-aid measures to stabilize patients until paramedics arrive on scene.',
    immediateActions: [
      'Ensure the immediate area is safe from traffic, electrical wires, or falling debris.',
      'Check for responsiveness: gently tap shoulders and ask loudly "Are you okay?".',
      'Check breathing: look, listen, and feel for chest movement for 10 seconds.',
      'If not breathing: begin hands-only chest compressions in center of chest (100–120 beats/min).',
      'Confirm dispatch with Rescue 1122 operator.'
    ],
    whileWaiting: [
      'Severe bleeding: Apply continuous firm pressure with a clean cloth or dressing.',
      'Unconscious but breathing normally: Place in Recovery Position on their side to keep airway open.',
      'Keep patient warm with a jacket or blanket to prevent hypothermia and shock.',
      'Have someone stand at the main gate/junction with a flashlight to guide the ambulance driver.'
    ],
    whatToTellResponders: [
      'Patient age, gender, and current state of consciousness.',
      'Whether patient is breathing and has a detectable pulse.',
      'Known medical history (diabetes, heart condition, allergies, medications taken).'
    ],
    safetyWarnings: [
      'General guidance only. Do not perform complex interventions without professional paramedic instruction.',
      'Never move neck or spine if spinal trauma is suspected.'
    ],
    verifiedContact: {
      service: 'Rescue 1122 Paramedics',
      number: '1122'
    }
  },
  {
    id: 'highway-breakdown',
    title: 'Vehicle Breakdown & Towing Safety',
    icon: '🛠️',
    category: 'Roadside Assistance',
    summary: 'Safe roadside breakdown protocol on Motorways (M-1 to M-16) and National Highways.',
    immediateActions: [
      'Steer smoothly onto the emergency shoulder or nearest lay-by on the extreme left.',
      'Switch on hazard warning lights immediately.',
      'Turn steering wheel away from the road so car will not roll into traffic if struck.',
      'Exit through the left-hand passenger doors and step over the steel safety barrier.',
      'Dial National Highways & Motorway Police on 130.'
    ],
    whileWaiting: [
      'Never stand or wait inside the vehicle or behind it on the shoulder.',
      'Place warning triangle at least 45 meters behind on regular roads; do not walk onto motorway lanes.',
      'Keep headlights and cabin light on at night or in heavy fog.'
    ],
    whatToTellResponders: [
      'Motorway / Highway number and direction (e.g. M-5 Southbound towards Sukkur).',
      'Nearest kilometer marker post (small green boards every kilometer on the shoulder).',
      'Vehicle make, color, and license plate number.'
    ],
    safetyWarnings: [
      'Never attempt to change a tire on the right-hand (traffic) side on a live motorway lane.',
      'NHMP provides free roadside patrol assistance and towing off the high-speed carriageway.'
    ],
    verifiedContact: {
      service: 'Motorway Police (NHMP)',
      number: '130'
    }
  },
  {
    id: 'gas-leak',
    title: 'Sui Gas Leak & Blast Prevention',
    icon: '🔥',
    category: 'Gas Emergency',
    summary: 'Critical safety steps when natural gas or LPG odor is detected.',
    immediateActions: [
      'Extinguish all naked flames, cigarettes, and incense immediately.',
      'Do NOT operate ANY electrical switches, doorbells, or mobile phones inside (a spark can ignite gas).',
      'Open all doors and windows wide to ventilate the area.',
      'Turn off the main gas control valve at the meter or LPG cylinder regulator.',
      'Evacuate the premises and dial SNGPL / SSGC Helpline 1199 from outside.'
    ],
    whileWaiting: [
      'Prevent anyone from entering the building.',
      'Keep upwind of the suspected gas leak area.'
    ],
    whatToTellResponders: [
      'Building address and meter number if visible.',
      'Whether hissing noise or strong sulfur odor is detected.'
    ],
    safetyWarnings: [
      'Never use a match or lighter to check for a gas leak.'
    ],
    verifiedContact: {
      service: 'Sui Gas Emergency Helpline',
      number: '1199'
    }
  }
];

export const GUIDANCE_LOCALIZED: Record<SupportedLanguage, Record<string, { title: string; immediate: string }>> = {
  en: {
    'road-accident': {
      title: 'Road Traffic Accident Response',
      immediate: 'Turn hazard lights on, move behind highway barrier, check for injuries, dial 1122 / 130.'
    },
    'fire-safety': {
      title: 'Fire Emergency & Evacuation',
      immediate: 'Sound alarm, evacuate via stairs, crawl low under smoke, dial 16.'
    },
    'waiting-ambulance': {
      title: 'While Waiting for Ambulance',
      immediate: 'Apply firm pressure to bleeding, maintain airway, keep patient warm, dial 1122.'
    },
    'highway-breakdown': {
      title: 'Highway Vehicle Breakdown',
      immediate: 'Pull to hard shoulder, hazard lights on, wait behind barrier, dial NHMP 130.'
    },
    'gas-leak': {
      title: 'Gas Leak Prevention',
      immediate: 'No electrical switches, open windows, shut main meter valve, dial 1199 from outside.'
    }
  },
  ur: {
    'road-accident': {
      title: 'سڑک حادثے کے بعد ہنگامی اقدامات',
      immediate: 'ہیزرڈ لائٹس آن کریں، محفوظ جگہ پر جائیں، زخمیوں کی حالت دیکھیں، فوری 1122 یا 130 ملائیں۔'
    },
    'fire-safety': {
      title: 'آگ سے بچاؤ اور انخلاء کے اصول',
      immediate: 'سب کو الرٹ کریں، سیڑھیوں سے باہر نکلیں، دھوئیں سے بچنے کے لیے جھک کر چلیں، فائر بریگیڈ 16 ملائیں۔'
    },
    'waiting-ambulance': {
      title: 'ایمبولینس کا انتظار کرتے ہوئے طبی امداد',
      immediate: 'خون بہنے والی جگہ پر دباؤ ڈالیں، مریض کا گلا صاف رکھیں، گرم کپڑا اوڑھیں، 1122 سے رابطہ رکھیں۔'
    },
    'highway-breakdown': {
      title: 'موٹروے پر گاڑی خراب ہونے کی صورت میں',
      immediate: 'گاڑی بائیں کندھے پر لگائیں، ہیزرڈ لائٹ جلائیں، جنگلے کے پیچھے کھڑے ہوں، 130 پر کال کریں۔'
    },
    'gas-leak': {
      title: 'سوئی گیس لیکیج ایمرجنسی',
      immediate: 'کوئی برقی سوئچ آن نہ کریں، کھڑکیاں کھولیں، مین والو بند کریں، باہر نکل کر 1199 ملائیں۔'
    }
  },
  ps: {
    'road-accident': {
      title: 'د سړک د ترافیکي پیښې پر مهال بیړني ګامونه',
      immediate: 'د موټر څراغونه بل کړئ، خوندي ځای ته لاړ شئ، د ژوبلو مرسته وکړئ او ۱۱۲۲ یا ۱۳۰ ته زنګ ووهئ.'
    },
    'fire-safety': {
      title: 'د اور لګیدو پر مهال د خوندیتوب لارښوونې',
      immediate: 'ټولو ته خبرداری ورکړئ، په زینو ښکته شئ، د لوګي له امله ټیټ لاړ شئ، اور وژونکو ۱۶ ته زنګ ووهئ.'
    },
    'waiting-ambulance': {
      title: 'د امبولانس په تمه لومړنۍ روغتیايي مرستې',
      immediate: 'د وینې بهیدلو ځای کلک ونیسئ، ناروغ ګرم وساتئ، تنفس ډاډمن کړئ، د ۱۱۲۲ لارښوونې تعقیب کړئ.'
    },
    'highway-breakdown': {
      title: 'په لویه لار د موټر د خرابیدو پر مهال ګامونه',
      immediate: 'موټر چپ لوري ته وباسئ، بیړني څراغونه بل کړئ، تر کټارې واوړئ او ۱۳۰ ته زنګ ووهئ.'
    },
    'gas-leak': {
      title: 'د سوئی ګازو د لیکیدو پر مهال احتیاط',
      immediate: 'برقی سویچ مه لګوئ، کړکۍ خلاصې کړئ، د ګازو وال بند کړئ او له بهر نه ۱۱۹۹ ته زنګ ووهئ.'
    }
  }
};
