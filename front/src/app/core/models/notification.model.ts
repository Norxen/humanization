export interface MentionNotification {
  id: string;
  type: 'mention';
  recipientId: string;
  actorId: string;
  projectId: string;
  projectName: string;
  projectSlug: string;
  documentPath: string;
  documentTitle: string;
  documentVersion: number;
  createdAt: Date | null;
  read: boolean;
  readAt: Date | null;
}
