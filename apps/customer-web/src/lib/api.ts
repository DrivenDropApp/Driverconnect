const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('dc-customer-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.accessToken || null;
    }
  } catch {}
  return null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  headers: Record<string, string> = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  sendOtp: (phone: string) =>
    request('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, role: 'customer' }),
    }),

  login: (phone: string, otp: string) =>
    request('/auth/customer/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  getMe: () => request('/auth/me'),

  completeProfile: (name: string, email: string) =>
    request('/auth/customer/complete-profile', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    }),

  // Profile
  getProfile: () => request('/customers/profile'),

  updateProfile: (data: any) =>
    request('/customers/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  addAddress: (address: any) =>
    request('/customers/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    }),

  deleteAddress: (addressId: string) =>
    request(`/customers/addresses/${addressId}`, { method: 'DELETE' }),

  addVehicle: (vehicle: any) =>
    request('/customers/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    }),

  // Bookings
  getFareEstimate: (payload: any) =>
    request('/bookings/fare-estimate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createBooking: (payload: any, idempotencyKey: string) =>
    request('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, { 'Idempotency-Key': idempotencyKey }),

  getMyBookings: (cursor?: string, status?: string) =>
    request(`/bookings/my?${cursor ? `cursor=${cursor}&` : ''}${status ? `status=${status}` : ''}`),

  getActiveBooking: () => request('/bookings/active'),

  getBooking: (id: string) => request(`/bookings/${id}`),

  startSearching: (id: string) =>
    request(`/bookings/${id}/search`, { method: 'POST' }),

  cancelBooking: (id: string) =>
    request(`/bookings/${id}/cancel`, { method: 'POST' }),

  rateBooking: (id: string, data: any) =>
    request(`/bookings/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
