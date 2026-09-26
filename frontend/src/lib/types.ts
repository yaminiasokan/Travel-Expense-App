export interface Profile {
  avatar: string | null;
  phone_number: string;
  bio: string;
  default_currency: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_verified: boolean;
  date_joined: string;
  profile: Profile;
}

export type TripStatus = "planning" | "active" | "completed" | "archived";
export type MemberRole = "owner" | "admin" | "member";
export type SplitType = "equal" | "percentage" | "exact" | "share";
export type SettlementStatus = "pending" | "partial" | "paid";

export interface Trip {
  id: string;
  name: string;
  destination: string;
  description: string;
  cover_image: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: string | null;
  currency: string;
  status: TripStatus;
  owner: User;
  invite_code: string;
  member_count: number;
  my_role: MemberRole | null;
  created_at: string;
  updated_at: string;
}

export interface TripMember {
  id: string;
  user: User;
  role: MemberRole;
  joined_at: string;
}

export interface TripDetail extends Trip {
  members: TripMember[];
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  is_default: boolean;
}

export interface ExpenseSplit {
  id: string;
  user: User;
  input_value: string | null;
  amount_owed: string;
}

export interface Expense {
  id: string;
  trip: string;
  title: string;
  amount: string;
  category: Category | null;
  paid_by: User;
  split_type: SplitType;
  expense_date: string;
  notes: string;
  location: string;
  receipt: string | null;
  splits: ExpenseSplit[];
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  settlement: string;
  amount: string;
  note: string;
  recorded_by: User;
  paid_at: string;
}

export interface Settlement {
  id: string;
  trip: string;
  from_user: User;
  to_user: User;
  amount: string;
  amount_paid: string;
  remaining_amount: string;
  status: SettlementStatus;
  payments: Payment[];
  generated_at: string;
  updated_at: string;
}

export interface Balance {
  user: User;
  net_balance: string;
}

export interface ActivityLog {
  id: string;
  actor: User | null;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  trip: string | null;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  success: false;
  message: string;
  errors: unknown;
}
