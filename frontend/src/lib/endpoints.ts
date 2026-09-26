import { api } from "./api";
import type {
  ActivityLog,
  Balance,
  Category,
  Expense,
  Notification,
  Paginated,
  Settlement,
  Trip,
  TripDetail,
  TripMember,
  User,
} from "./types";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  register: (payload: {
    email: string;
    full_name: string;
    password: string;
    password_confirm: string;
  }) =>
    api
      .post<{ user: User; tokens: { access: string; refresh: string } }>(
        "/auth/register/",
        payload
      )
      .then((r) => r.data),

  login: (payload: { email: string; password: string }) =>
    api
      .post<{ user: User; tokens: { access: string; refresh: string } }>(
        "/auth/login/",
        payload
      )
      .then((r) => r.data),

  me: () => api.get<User>("/auth/me/").then((r) => r.data),

  logout: (refresh: string) => api.post("/auth/logout/", { refresh }),
};

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------
export const tripsApi = {
  list: (params?: Record<string, string>) =>
    api.get<Paginated<Trip>>("/trips/", { params }).then((r) => r.data),

  get: (id: string) => api.get<TripDetail>(`/trips/${id}/`).then((r) => r.data),

  create: (payload: Partial<Trip>) =>
    api.post<Trip>("/trips/", payload).then((r) => r.data),

  update: (id: string, payload: Partial<Trip>) =>
    api.patch<Trip>(`/trips/${id}/`, payload).then((r) => r.data),

  remove: (id: string) => api.delete(`/trips/${id}/`),

  archive: (id: string) => api.post<Trip>(`/trips/${id}/archive/`).then((r) => r.data),

  members: (id: string) =>
    api.get<TripMember[]>(`/trips/${id}/members/`).then((r) => r.data),

  invite: (id: string, email?: string) =>
    api.post(`/trips/${id}/invite/`, { email }).then((r) => r.data),

  join: (code: string) =>
    api.post<TripDetail>("/trips/join/", { code }).then((r) => r.data),

  activity: (id: string) =>
    api.get<ActivityLog[]>(`/trips/${id}/activity/`).then((r) => r.data),

  removeMember: (tripId: string, memberId: string) =>
    api.delete(`/trips/${tripId}/members/${memberId}/`),

  updateMemberRole: (tripId: string, memberId: string, role: string) =>
    api.post(`/trips/${tripId}/members/${memberId}/role/`, { role }).then((r) => r.data),

  balances: (id: string) =>
    api.get<Balance[]>(`/trips/${id}/balances/`).then((r) => r.data),

  generateSettlements: (id: string) =>
    api
      .post<{ success: boolean; message: string; settlements: Settlement[] }>(
        `/trips/${id}/settlements/generate/`
      )
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------
export interface SplitParticipantInput {
  user_id: string;
  value?: string;
}

export interface CreateExpensePayload {
  trip: string;
  title: string;
  amount: string;
  category_id?: number;
  paid_by_id: string;
  split_type: string;
  expense_date: string;
  notes?: string;
  location?: string;
  split_between: SplitParticipantInput[];
}

export const expensesApi = {
  list: (tripId: string, params?: Record<string, string>) =>
    api
      .get<Paginated<Expense>>("/expenses/", { params: { trip: tripId, ...params } })
      .then((r) => r.data),

  get: (id: string) => api.get<Expense>(`/expenses/${id}/`).then((r) => r.data),

  create: (payload: CreateExpensePayload) =>
    api.post<Expense>("/expenses/", payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateExpensePayload>) =>
    api.patch<Expense>(`/expenses/${id}/`, payload).then((r) => r.data),

  remove: (id: string) => api.delete(`/expenses/${id}/`),

  categories: () => api.get<Category[]>("/categories/").then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const notificationsApi = {
  list: () => api.get<Paginated<Notification>>("/notifications/").then((r) => r.data),
  markRead: (id: string) => api.post<Notification>(`/notifications/${id}/read/`).then((r) => r.data),
  markAllRead: () => api.post("/notifications/read-all/"),
};

// ---------------------------------------------------------------------------
// Settlements
// ---------------------------------------------------------------------------
export const settlementsApi = {
  list: (tripId: string) =>
    api
      .get<Paginated<Settlement>>("/settlements/", { params: { trip: tripId } })
      .then((r) => r.data),

  pay: (id: string, amount: string, note?: string) =>
    api.post<Settlement>(`/settlements/${id}/pay/`, { amount, note }).then((r) => r.data),
};
