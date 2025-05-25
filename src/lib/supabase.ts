import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Folder {
  id: string
  name: string
  date: string
  created_by: string
  created_at: string
  updated_by?: string
  updated_at?: string
  cover_photo_url?: string
}

export interface Photo {
  id: string
  folder_id: string
  url: string
  uploaded_by: 'Dad' | 'Mom'
  uploaded_at: string
}

export interface Note {
  id: string
  folder_id: string
  content: string
  updated_at: string
  updated_by: 'Dad' | 'Mom'
}

export interface ActivityLog {
  id: string
  action: string
  details: string
  user: 'Dad' | 'Mom'
  timestamp: string
}
