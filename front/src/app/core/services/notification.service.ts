import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { Unsubscribe } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import { MentionNotification } from '../models/notification.model';

interface NotificationData extends Omit<MentionNotification, 'id' | 'createdAt' | 'readAt'> {
  createdAt?: { toDate(): Date };
  readAt?: { toDate(): Date } | null;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly auth = inject(AuthService);
  private readonly firebase = inject(FirebaseService);
  private unsubscribe: Unsubscribe | null = null;
  private generation = 0;

  readonly notifications = signal<MentionNotification[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.read).length
  );

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.uid ?? null;
      void this.watch(userId);
    });
  }

  async markRead(notification: MentionNotification): Promise<void> {
    if (notification.read || this.auth.user()?.uid !== notification.recipientId) return;
    const firestore = await this.firebase.firestore();
    const { doc, serverTimestamp, updateDoc } = await import('firebase/firestore');
    await updateDoc(
      doc(firestore, 'users', notification.recipientId, 'notifications', notification.id),
      { read: true, readAt: serverTimestamp() }
    );
  }

  async markAllRead(): Promise<void> {
    const userId = this.auth.user()?.uid;
    const unread = this.notifications().filter((notification) => !notification.read);
    if (!userId || !unread.length) return;
    const firestore = await this.firebase.firestore();
    const { doc, serverTimestamp, writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(firestore);
    for (const notification of unread) {
      batch.update(
        doc(firestore, 'users', userId, 'notifications', notification.id),
        { read: true, readAt: serverTimestamp() }
      );
    }
    await batch.commit();
  }

  private async watch(userId: string | null): Promise<void> {
    const generation = ++this.generation;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.notifications.set([]);
    this.error.set(null);
    if (!userId) return;

    this.loading.set(true);
    try {
      const firestore = await this.firebase.firestore();
      if (generation !== this.generation) return;
      const { collection, limit, onSnapshot, orderBy, query } = await import(
        'firebase/firestore'
      );
      const reference = query(
        collection(firestore, 'users', userId, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
      this.unsubscribe = onSnapshot(
        reference,
        (snapshot) => {
          this.notifications.set(
            snapshot.docs.map((entry) => {
              const data = entry.data() as NotificationData;
              return {
                ...data,
                id: entry.id,
                createdAt: data.createdAt?.toDate() ?? null,
                readAt: data.readAt?.toDate() ?? null
              };
            })
          );
          this.loading.set(false);
        },
        (error) => {
          this.error.set(error.message);
          this.loading.set(false);
        }
      );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load notifications.');
      this.loading.set(false);
    }
  }
}
