export interface Workspace { id: string; name: string; user_id: string; logo_url?: string | null; wordmark_url?: string | null }
export interface Channel { id: string; workspace_id: string; user_id: string; name: string; icon_url?: string | null; sort_order: number }
export interface Category { id: string; channel_id: string; user_id: string; name: string; sort_order: number }
export interface Tool { id: string; category_id: string; user_id: string; name: string; url: string; logo_url?: string | null; tags?: string[] | null; sort_order: number }
export type TaskPriority = 'low' | 'medium' | 'high'
export interface Task {
  id: string; user_id: string; title: string; notes?: string | null
  priority: TaskPriority; due_date?: string | null; completed: boolean
  tool_id?: string | null; created_at: string
}
