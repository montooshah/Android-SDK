export interface TriagedMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  originalSubject: string;
  receivedAt: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  category: 'permission_slip' | 'grade_alert' | 'announcement' | 'emergency';
  tldr: string;
  actionRequired: boolean;
  actionDeadline?: string;
  suggestedReplies: string[];
  status: 'pending' | 'resolved';
}
