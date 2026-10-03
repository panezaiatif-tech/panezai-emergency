export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'OUTDATED';

export type EmergencyCategory =
  | 'Ambulance'
  | 'Fire Brigade'
  | 'Police'
  | 'Hospital Emergency'
  | 'Blood Bank'
  | 'Emergency Pharmacy'
  | 'Mechanic'
  | 'Towing / Roadside Assistance'
  | 'Motorway / Highway Police'
  | 'Flood Rescue'
  | 'Mountain Rescue'
  | 'Rescue Services'
  | 'Disaster Management'
  | 'Bomb Disposal'
  | 'Animal Rescue / Veterinary Emergency'
  | 'Civil Defence'
  | 'Railway Emergency'
  | 'Airport Emergency'
  | 'Electricity Emergency'
  | 'Water Emergency'
  | 'Gas Emergency'
  | 'Family Emergency Contacts';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface EmergencyRecord {
  id: string;
  country: 'Pakistan';
  province: string; // e.g., 'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory', 'Azad Jammu & Kashmir', 'Gilgit-Baltistan', 'National / All Pakistan'
  division?: string;
  district: string;
  tehsil?: string;
  city: string;
  area?: string;
  category: EmergencyCategory;
  organization: string;
  phone: string;
  altPhone?: string;
  is24_7: boolean;
  verificationStatus: VerificationStatus;
  officialSource: string;
  verificationDate: string;
  lastUpdated: string;
  notes?: string;
  address?: string;
  coordinates?: Coordinates;
  distanceKm?: number; // Calculated at runtime based on GPS
}

export interface FamilyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isFavorite?: boolean;
}

export interface UserReport {
  id: string;
  recordId?: string;
  organizationName: string;
  reportedPhone: string;
  location: string;
  reason: 'wrong_number' | 'not_responding' | 'outdated_service' | 'new_number_suggested' | 'other';
  suggestedCorrection?: string;
  reporterPhone?: string;
  createdAt: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

export interface HistoryLog {
  id: string;
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'REVERIFY';
  recordId: string;
  organizationName: string;
  details: string;
  timestamp: string;
  adminName: string;
}

export type SupportedLanguage = 'en' | 'ur' | 'ps';

export interface CallLog {
  id: string;
  name: string;
  phone: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other' | 'system';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isLocation?: boolean;
  locationCoords?: Coordinates;
  isAudio?: boolean;
}

export interface ChatConversation {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  category: 'emergency' | 'family' | 'community' | 'doctor';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface CommunityAlert {
  id: string;
  authorName: string;
  authorPhone: string;
  category: 'Blood Need' | 'Accident Alert' | 'Road Block' | 'Flood / Disaster' | 'Medical Help' | 'General';
  location: string;
  description: string;
  urgency: 'CRITICAL' | 'HIGH' | 'NORMAL';
  timestamp: string;
  sharesCount: number;
  verified: boolean;
}

export interface VoiceIntakeResult {
  originalSpeech: string;
  detectedUrgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  detectedCategory: EmergencyCategory;
  recommendedNumber: string;
  recommendedService: string;
  locationHint?: string;
  spokenAdvice: string;
}

export interface EmergencyGuidanceTopic {
  id: string;
  title: string;
  icon: string;
  category: string;
  summary: string;
  immediateActions: string[];
  whileWaiting: string[];
  whatToTellResponders: string[];
  safetyWarnings: string[];
  verifiedContact: {
    service: string;
    number: string;
  };
}

export interface VoiceAssistantResponse {
  spokenReply: string;
  isEmergencyMode: boolean;
  emergencyType?: string;
  matchedRecords: EmergencyRecord[];
  guidance?: string[];
  guidanceTopic?: EmergencyGuidanceTopic;
  suggestedActions: ('ambulance' | 'police' | 'hospital' | 'family' | 'location')[];
  safetyNote?: string;
}

export const EMERGENCY_RUNTIME_READY = true;
