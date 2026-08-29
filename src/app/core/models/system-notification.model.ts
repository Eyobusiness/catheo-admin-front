export type NotificationType = 'alerte' | 'activite' | 'rappel' | 'info' | string;
export type NotificationColor = 'info' | 'warning' | 'danger' | 'success' | 'primary' | 'secondary' | string;

export interface SystemNotification {
  id: string | number;
  type: NotificationType;
  titre: string;
  message: string;
  route_url?: string;
  couleur?: NotificationColor;
  is_read?: boolean;
  read_at?: string | null;
  created_at?: string;
  updated_at?: string;
  meta_data?: Record<string, any>;
}

export interface AlertSummaryItem {
  id: string | number;
  type: NotificationType;
  titre: string;
  message: string;
  route_url?: string;
  couleur?: NotificationColor;
  meta_data?: Record<string, any>;
}

export interface AlertsSummaryResponse {
  total_alertes: number;
  preinscriptions_en_attente?: number;
  appels_non_faits?: number;
  alerts_list: AlertSummaryItem[];
}

export interface UnreadCountResponse {
  unread_count: number;
  recent_notifications?: SystemNotification[];
}

export type NotificationTabType = 'all' | 'alerte' | 'activite' | 'rappel';
