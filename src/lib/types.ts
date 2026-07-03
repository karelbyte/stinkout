export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  description: string | null;
  website: string | null;
  slug: string | null;
  created_at: string;
}

export interface Recruiter {
  id: number;
  name: string;
  company_id: number | null;
  company_name: string | null;
  email: string | null;
  slug: string | null;
  created_at: string;
}

export interface Review {
  id: number;
  user_id: number | null;
  recruiter_id: number | null;
  company_id: number | null;
  recruiter_name: string | null;
  recruiter_slug: string | null;
  company_name: string | null;
  company_slug: string | null;
  title: string;
  description: string;
  rating: number;
  status: string;
  created_at: string;
  ratification_count: number;
  ratified_by_me: boolean;
}

export interface Evidence {
  id: number;
  review_id: number;
  user_id: number | null;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
  validation_count?: number;
  validated_by_me?: boolean;
}

export interface EvidenceValidation {
  id: number;
  evidence_id: number;
  user_id: number;
  created_at: string;
}
