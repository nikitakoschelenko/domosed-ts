export interface MerchantInfo {
  id: number;
  name: string;
  description: string;
  group_id: number;
  avatar: string;
  money: number;
  is_allow: boolean;
  webhook_url?: string;
}
