import {
  CallLog,
  ChatConversation,
  ChatMessage,
  CommunityAlert,
  EmergencyRecord,
  FamilyContact,
  HistoryLog,
  SupportedLanguage,
  UserReport,
} from '../types/emergency.ts';
import { INITIAL_EMERGENCY_RECORDS } from '../data/emergencyDatabase.ts';

const DB_KEY = 'pen_emergency_database_v2';
const SYNC_KEY = 'pen_last_sync_timestamp';
const FAMILY_KEY = 'pen_family_contacts';
const REPORTS_KEY = 'pen_user_reports';
const AUDIT_KEY = 'pen_audit_logs';
const LANG_KEY = 'pen_selected_language';
const CALLS_KEY = 'pen_call_logs_v1';
const ALERTS_KEY = 'pen_community_alerts_v1';
const CHAT_MSGS_PREFIX = 'pen_chat_msgs_';

const INITIAL_COMMUNITY_ALERTS: CommunityAlert[] = [
  {
    id: 'alt-001',
    authorName: 'Dr. Tariq Panezai',
    authorPhone: '0300-8381122',
    category: 'Blood Need',
    location: 'Bolan Medical Complex (BMC), Quetta',
    description: 'URGENT: 2 Units of B-Negative (B-) Blood needed for emergency surgery patient in Trauma Casualty ward. Please contact or WhatsApp immediately.',
    urgency: 'CRITICAL',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    sharesCount: 42,
    verified: true,
  },
  {
    id: 'alt-002',
    authorName: 'Rescue 1122 Highway Patrol',
    authorPhone: '1122',
    category: 'Road Block',
    location: 'Lakpass Tunnel & Bolan Pass, N-25 / N-65',
    description: 'Advisory: Road cleared after truck breakdown. Traffic moving slowly. Heavy vehicles advised to proceed with caution.',
    urgency: 'HIGH',
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    sharesCount: 128,
    verified: true,
  },
  {
    id: 'alt-003',
    authorName: 'Community Welfare Volunteer',
    authorPhone: '0333-7894561',
    category: 'Medical Help',
    location: 'Civil Hospital Lahore, Emergency Ward',
    description: 'Free wheelchairs and volunteer assistance available for elderly or injured patients visiting casualty counter 4.',
    urgency: 'NORMAL',
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    sharesCount: 31,
    verified: true,
  },
];

const INITIAL_CALL_LOGS: CallLog[] = [
  {
    id: 'call-1',
    name: 'Rescue 1122 Helpline',
    phone: '1122',
    type: 'outgoing',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    duration: '1m 24s',
  },
  {
    id: 'call-2',
    name: 'Brother Ahmad (Family)',
    phone: '0300-1234567',
    type: 'incoming',
    timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
    duration: '3m 12s',
  },
  {
    id: 'call-3',
    name: 'Police Emergency 15',
    phone: '15',
    type: 'missed',
    timestamp: new Date(Date.now() - 800 * 60000).toISOString(),
  },
];

export const storageService = {
  // Database retrieval
  getRecords(): EmergencyRecord[] {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (!stored) {
        this.saveRecords(INITIAL_EMERGENCY_RECORDS);
        return INITIAL_EMERGENCY_RECORDS;
      }
      const parsed: EmergencyRecord[] = JSON.parse(stored);
      return parsed.length > 0 ? parsed : INITIAL_EMERGENCY_RECORDS;
    } catch {
      return INITIAL_EMERGENCY_RECORDS;
    }
  },

  // Save records
  saveRecords(records: EmergencyRecord[]): void {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(records));
      localStorage.setItem(SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  },

  // Reset to initial verified dataset
  resetToDefault(): EmergencyRecord[] {
    localStorage.removeItem(DB_KEY);
    this.saveRecords(INITIAL_EMERGENCY_RECORDS);
    this.addAuditLog({
      id: 'log-' + Date.now(),
      action: 'UPDATE',
      recordId: 'all',
      organizationName: 'System Reset',
      details: 'Reset emergency database to official initial state',
      timestamp: new Date().toISOString(),
      adminName: 'Admin',
    });
    return INITIAL_EMERGENCY_RECORDS;
  },

  // Last sync timestamp
  getLastSyncTimestamp(): string {
    const ts = localStorage.getItem(SYNC_KEY);
    if (!ts) {
      const now = new Date().toISOString();
      localStorage.setItem(SYNC_KEY, now);
      return now;
    }
    return ts;
  },

  // Family Contacts
  getFamilyContacts(): FamilyContact[] {
    try {
      const stored = localStorage.getItem(FAMILY_KEY);
      if (!stored) {
        const defaultContacts: FamilyContact[] = [
          { id: 'f-1', name: 'Brother (Family SOS)', relation: 'Brother', phone: '0300-1234567', isFavorite: true },
          { id: 'f-2', name: 'Father / Guardian', relation: 'Father', phone: '0333-9876543', isFavorite: true },
        ];
        this.saveFamilyContacts(defaultContacts);
        return defaultContacts;
      }
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  saveFamilyContacts(contacts: FamilyContact[]): void {
    localStorage.setItem(FAMILY_KEY, JSON.stringify(contacts));
  },

  // Call Logs (Offline Calls / Recent)
  getCallLogs(): CallLog[] {
    try {
      const stored = localStorage.getItem(CALLS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_CALL_LOGS;
    } catch {
      return INITIAL_CALL_LOGS;
    }
  },

  addCallLog(log: CallLog): void {
    const list = this.getCallLogs();
    list.unshift(log);
    if (list.length > 50) list.pop();
    localStorage.setItem(CALLS_KEY, JSON.stringify(list));
  },

  clearCallLogs(): void {
    localStorage.setItem(CALLS_KEY, JSON.stringify([]));
  },

  // Community Alerts
  getCommunityAlerts(): CommunityAlert[] {
    try {
      const stored = localStorage.getItem(ALERTS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_COMMUNITY_ALERTS;
    } catch {
      return INITIAL_COMMUNITY_ALERTS;
    }
  },

  addCommunityAlert(alert: CommunityAlert): void {
    const list = this.getCommunityAlerts();
    list.unshift(alert);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(list));
  },

  incrementAlertShare(id: string): void {
    const list = this.getCommunityAlerts().map((a) =>
      a.id === id ? { ...a, sharesCount: a.sharesCount + 1 } : a
    );
    localStorage.setItem(ALERTS_KEY, JSON.stringify(list));
  },

  // Chat Messages
  getChatMessages(conversationId: string): ChatMessage[] {
    try {
      const stored = localStorage.getItem(CHAT_MSGS_PREFIX + conversationId);
      if (stored) return JSON.parse(stored);

      // Default seed messages for emergency responder
      if (conversationId === 'conv-emergency') {
        return [
          {
            id: 'm-1',
            sender: 'other',
            text: 'Official Emergency Response Desk (Rescue 1122 / Police 15). How can we assist you? You can send your live GPS location or call directly at zero internet cost.',
            timestamp: '09:00 AM',
            status: 'read',
          },
        ];
      }
      return [];
    } catch {
      return [];
    }
  },

  saveChatMessages(conversationId: string, messages: ChatMessage[]): void {
    localStorage.setItem(CHAT_MSGS_PREFIX + conversationId, JSON.stringify(messages));
  },

  // User Problem Reports
  getReports(): UserReport[] {
    try {
      const stored = localStorage.getItem(REPORTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addReport(report: UserReport): void {
    const list = this.getReports();
    list.unshift(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
  },

  resolveReport(reportId: string): void {
    const list = this.getReports().map((r) =>
      r.id === reportId ? { ...r, status: 'RESOLVED' as const } : r
    );
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
  },

  // Audit Logs
  getAuditLogs(): HistoryLog[] {
    try {
      const stored = localStorage.getItem(AUDIT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addAuditLog(log: HistoryLog): void {
    const logs = this.getAuditLogs();
    logs.unshift(log);
    if (logs.length > 100) logs.pop();
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
  },

  // Language
  getLanguage(): SupportedLanguage {
    const lang = localStorage.getItem(LANG_KEY);
    if (lang === 'ur' || lang === 'ps' || lang === 'en') return lang;
    return 'en';
  },

  setLanguage(lang: SupportedLanguage): void {
    localStorage.setItem(LANG_KEY, lang);
  },
};
