const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('dc-driver-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.accessToken || null;
    }
  } catch {}
  return null;
}

async function request<T>(path: string, options: RequestInit = {}, extraHeaders: Record<string, string> = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...extraHeaders,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const driverApi = {
  getUploadSignature: () => request('/upload/signature'),

  sendOtp: (phone: string) =>
    request('/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone, role: 'driver' }) }),

  login: (phone: string, otp: string) =>
    request('/auth/driver/login', { method: 'POST', body: JSON.stringify({ phone, otp }) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  getProfile: () => request('/drivers/profile'),

  updateProfile: (data: any) =>
    request('/drivers/profile', { method: 'PUT', body: JSON.stringify(data) }),

  toggleOnline: (isOnline: boolean, location?: { lat: number; lng: number }) =>
    request('/drivers/toggle-online', {
      method: 'POST',
      body: JSON.stringify({ isOnline, location }),
    }),

  updateLocation: (lat: number, lng: number) =>
    request('/drivers/location', { method: 'POST', body: JSON.stringify({ lat, lng }) }),

  updateKyc: (data: any) =>
    request('/drivers/kyc', { method: 'PUT', body: JSON.stringify(data) }),

  updateBankDetails: (data: any) =>
    request('/drivers/bank-details', { method: 'PUT', body: JSON.stringify(data) }),

  getEarnings: (period: string = 'today') =>
    request(`/drivers/earnings?period=${period}`),

  getActiveTrip: () => request('/drivers/active-trip'),

  getMyBookings: (cursor?: string, status?: string) =>
    request(`/bookings/driver?${cursor ? `cursor=${cursor}&` : ''}${status ? `status=${status}` : ''}`),

  getBooking: (id: string) => request(`/bookings/${id}`),

  acceptBooking: (id: string) =>
    request(`/bookings/${id}/accept`, { method: 'POST' }),

  arrive: (id: string) =>
    request(`/bookings/${id}/arrive`, { method: 'POST' }),

  verifyOtp: (id: string, otp: string) =>
    request(`/bookings/${id}/verify-otp`, { method: 'POST', body: JSON.stringify({ otp }) }),

  startTrip: (id: string) =>
    request(`/bookings/${id}/start`, { method: 'POST' }),

  completeTrip: (id: string) =>
    request(`/bookings/${id}/complete`, { method: 'POST' }),
};
