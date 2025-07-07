export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  color?: string;
}

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  role: 'admin' | 'member';
  dietary_preferences: Record<string, any>;
  allergies: string[];
  shopping_preferences: Record<string, any>;
  created_at: string;
}

export interface FoodRequest {
  id: number;
  household_id: string;
  requested_by: string;
  item_name: string;
  item_description: string | null;
  quantity: number;
  unit: string | null;
  status: 'pending' | 'approved' | 'declined';
  section: string | null;
  priority: 'urgent' | 'normal';
  is_manual: boolean;
  is_purchased: boolean;
  is_accepted: boolean;
  accepted_by: string | null;
  accepted_at: string | null;
  purchased_at: string | null;
  created_at: string;
  version: number;
  version_history: any[];
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  created_by: string;
  icon: string | null;
  color: string | null;
}

export interface ItemMetadata {
  id: string;
  item_name: string;
  category_id: string | null;
  typical_unit: string | null;
  typical_quantity: number | null;
  nutritional_info: Record<string, any> | null;
  storage_tips: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PriceHistory {
  id: string;
  item_name: string;
  store_name: string;
  price: number;
  unit: string | null;
  recorded_at: string;
  recorded_by: string | null;
}

export interface PriceTrends {
  avg_price: number;
  min_price: number;
  max_price: number;
  price_trend: number;
}

export interface Store {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Profile>;
      };
      households: {
        Row: Household;
        Insert: Omit<Household, 'created_at'>;
        Update: Partial<Household>;
      };
      household_members: {
        Row: HouseholdMember;
        Insert: Omit<HouseholdMember, 'created_at'>;
        Update: Partial<HouseholdMember>;
      };
      food_requests: {
        Row: FoodRequest;
        Insert: Omit<FoodRequest, 'created_at' | 'version' | 'version_history' | 'deleted_at' | 'deleted_by'>;
        Update: Partial<FoodRequest>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'created_at'>;
        Update: Partial<Category>;
      };
      item_metadata: {
        Row: ItemMetadata;
        Insert: Omit<ItemMetadata, 'created_at' | 'updated_at'>;
        Update: Partial<ItemMetadata>;
      };
      price_history: {
        Row: PriceHistory;
        Insert: Omit<PriceHistory, 'id' | 'recorded_at'>;
        Update: Partial<PriceHistory>;
      };
      stores: {
        Row: Store;
        Insert: Omit<Store, 'id' | 'created_at'>;
        Update: Partial<Store>;
      };
    };
    Functions: {
      get_price_trends: {
        Args: {
          p_item_name: string;
          p_store_name: string;
          p_days?: number;
        };
        Returns: PriceTrends;
      };
    };
  };
} 