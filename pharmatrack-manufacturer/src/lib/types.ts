export interface Product {
  id: string;
  manufacturer_id: string;
  serial_code: string;
  product_name: string;
  batch_number: string;
  expiry_date: string;
  manufacturer: string;
  dosage_form: string;
  strength: string;
  country_of_origin: string;
  registration_number: string;
  active_ingredient: string;
  storage_conditions: string;
  units_produced: number;
  created_at: string;
  status: 'active' | 'recalled' | 'expired';
}

export interface Recall {
  id: string;
  product_id: string;
  batch_number: string;
  reason: string;
  severity: 'low' | 'moderate' | 'high';
  reference_number: string;
  return_instructions: string;
  hotline_phone: string;
  created_at: string;
  resolved_at: string | null;
}

export interface Report {
  id: string;
  user_id: string | null;
  product_id: string | null;
  code_scanned: string | null;
  product_name: string | null;
  reason: 'counterfeit' | 'packaging_damage' | 'wrong_medicine' | 'suspicious_seller' | 'other';
  description: string | null;
  pharmacy_name: string | null;
  pharmacy_location: string | null;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  manufacturer_response: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ScanStat {
  product_id: string;
  total: number;
  authentic: number;
  duplicate: number;
  unknown: number;
}
