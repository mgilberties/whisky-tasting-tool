export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          code: string;
          host_name: string;
          host_user_id: string | null;
          status:
          | "waiting"
          | "collecting"
          | "reviewing"
          | "revealed"
          | "finished";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          host_name: string;
          host_user_id?: string | null;
          status?:
          | "waiting"
          | "collecting"
          | "reviewing"
          | "revealed"
          | "finished";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          host_name?: string;
          host_user_id?: string | null;
          status?:
          | "waiting"
          | "collecting"
          | "reviewing"
          | "revealed"
          | "finished";
          created_at?: string;
          updated_at?: string;
        };
      };
      participants: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          user_id?: string | null;
          created_at?: string;
        };
      };
      session_invitations: {
        Row: {
          id: string;
          session_id: string;
          email: string;
          invited_by: string | null;
          status: "pending" | "accepted" | "declined";
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          email: string;
          invited_by?: string | null;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          email?: string;
          invited_by?: string | null;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
          accepted_at?: string | null;
        };
      };
      whiskies: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          age: number | null;
          abv: number;
          region: string;
          distillery: string;
          category: string;
          bottling_type: "IB" | "OB";
          cask_type: string | null;
          host_score: number | null;
          whiskybase_link: string | null;
          tasting_reference: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          age?: number | null;
          abv: number;
          region: string;
          distillery: string;
          category: string;
          bottling_type: "IB" | "OB";
          cask_type?: string | null;
          host_score?: number | null;
          whiskybase_link?: string | null;
          tasting_reference?: string | null;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          age?: number | null;
          abv?: number;
          region?: string;
          distillery?: string;
          category?: string;
          bottling_type?: "IB" | "OB";
          cask_type?: string | null;
          host_score?: number | null;
          whiskybase_link?: string | null;
          tasting_reference?: string | null;
          order_index?: number;
          created_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          session_id: string;
          participant_id: string;
          whisky_id: string;
          guessed_name: string;
          guessed_score: number;
          guessed_age: number | null;
          guessed_abv: number;
          guessed_region: string;
          guessed_distillery: string;
          guessed_category: string;
          guessed_bottling_type: "IB" | "OB";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          participant_id: string;
          whisky_id: string;
          guessed_name: string;
          guessed_score: number;
          guessed_age?: number | null;
          guessed_abv: number;
          guessed_region: string;
          guessed_distillery: string;
          guessed_category: string;
          guessed_bottling_type: "IB" | "OB";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          participant_id?: string;
          whisky_id?: string;
          guessed_name?: string;
          guessed_score?: number;
          guessed_age?: number | null;
          guessed_abv?: number;
          guessed_region?: string;
          guessed_distillery?: string;
          guessed_category?: string;
          guessed_bottling_type?: "IB" | "OB";
          created_at?: string;
          updated_at?: string;
        };
      };
      keep_alive: {
        Row: {
          id: number;
          name: string | null;
          random: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name?: string | null;
          random?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string | null;
          random?: string | null;
          created_at?: string;
        };
      };
      regions: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      distilleries: {
        Row: {
          id: string;
          name: string;
          region_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          region_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          region_id?: string;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          is_disabled: boolean;
          disabled_at: string | null;
          disabled_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          is_disabled?: boolean;
          disabled_at?: string | null;
          disabled_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          is_disabled?: boolean;
          disabled_at?: string | null;
          disabled_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      disable_user_account: {
        Args: {
          user_id: string;
          disabled_by_user_id?: string | null;
        };
        Returns: void;
      };
      enable_user_account: {
        Args: {
          user_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
