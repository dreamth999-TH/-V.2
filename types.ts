export interface WasteRecord {
  id: string;
  timestamp: string;
  addressType: string;
  addressTypeOther?: string; // If 'Other' is selected
  community: string;
  fullName: string;
  shopName?: string;
  address: string;
  street: string;
  phone: string;
  householdSize: number;
  wasteMethods: string[]; // Multi-select
  waterMethods: string[]; // Multi-select
  responsiblePerson: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
}

export type ConnectionStatus = 'online' | 'offline' | 'loading';

export interface DashboardStats {
  total: number;
  wasteStats: Record<string, number>;
  waterStats: Record<string, number>;
  responsibleStats: Record<string, number>;
}