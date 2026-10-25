export type BetStatus = 'pending' | 'won' | 'lost' | 'push';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tracked_bets: {
        Row: {
          id: string;
          user_id: string;
          sport: string;
          event_name: string;
          selection: string;
          sportsbook: string | null;
          american_odds: number;
          stake: number;
          status: BetStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport: string;
          event_name: string;
          selection: string;
          sportsbook?: string | null;
          american_odds: number;
          stake: number;
          status?: BetStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport?: string;
          event_name?: string;
          selection?: string;
          sportsbook?: string | null;
          american_odds?: number;
          stake?: number;
          status?: BetStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
