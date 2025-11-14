export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          code: string;
          host_name: string;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          created_at?: string;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
