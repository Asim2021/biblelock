export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          is_premium: boolean;
          daily_goal_minutes: number;
          translation: 'WEB' | 'KJV';
          blocked_apps: string[];
          current_streak: number;
          last_read_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          daily_goal_minutes?: number;
          translation?: 'WEB' | 'KJV';
          blocked_apps?: string[];
          current_streak?: number;
          last_read_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          daily_goal_minutes?: number;
          translation?: 'WEB' | 'KJV';
          blocked_apps?: string[];
          current_streak?: number;
          last_read_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      reading_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          seconds_read: number;
          goal_minutes: number;
          is_goal_met: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          seconds_read?: number;
          goal_minutes?: number;
          is_goal_met?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          seconds_read?: number;
          goal_minutes?: number;
          is_goal_met?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reading_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type UserProfile = Database['public']['Tables']['profiles']['Row'];
export type ReadingSession = Database['public']['Tables']['reading_sessions']['Row'];
