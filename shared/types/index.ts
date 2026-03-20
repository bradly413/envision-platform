// Shared TypeScript types across admin + portal

export type ClientStage = 'lead' | 'proposal' | 'active' | 'revision' | 'delivered' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type PortalStatus = 'draft' | 'active' | 'expired' | 'archived';
export type PortalEventType = 'login' | 'scroll' | 'section_view' | 'video_play' | 'approve' | 'revision_requested' | 'comment' | 'logout';

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  stage: ClientStage;
  project_type?: string;
  budget?: number;
  revenue?: number;
  notes?: string;
  tags?: string[];
  open_tasks?: number;
  portals?: number;
  created_at: string;
  updated_at: string;
}

export interface Portal {
  id: string;
  client_id: string;
  client_name?: string;
  company?: string;
  slug: string;
  template_id: string;
  status: PortalStatus;
  content: PortalContent;
  expires_at?: string;
  total_events?: number;
  created_at: string;
  updated_at: string;
}

export interface PortalContent {
  hero?: { headline?: string; subheadline?: string; intro?: string; };
  brand?: { headline?: string; positioning?: string; pillars?: Array<{ title: string; desc: string }>; };
  logo?: { headline?: string; logoUrl?: string; rationale?: string; };
  colors?: { headline?: string; palette?: Array<{ name: string; hex: string; role: string }>; };
  typography?: { headline?: string; fonts?: Array<{ name: string; typeface: string; usage: string; stack?: string }>; };
}

export interface Task {
  id: string;
  client_id?: string;
  client_name?: string;
  title: string;
  description?: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  due_date?: string;
  created_at: string;
}

export interface PortalAnalytics {
  totalVisits: number;
  totalEvents: number;
  maxScrollDepth: number;
  avgSessionMinutes: number;
  sectionsViewed: string[];
  approved: boolean;
  timeline: PortalEvent[];
}

export interface PortalEvent {
  id: string;
  portal_id: string;
  event_type: PortalEventType;
  payload: Record<string, unknown>;
  created_at: string;
}
