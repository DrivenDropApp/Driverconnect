const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('dc-admin-auth');
    if (stored) return JSON.parse(stored)?.state?.accessToken || null;
  } catch {}
  return null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const adminApi = {
  login: (email: string, password: string) =>
    request('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  getDashboard: () => request('/admin/dashboard'),

  getKycQueue: (status = 'pending', cursor?: string) =>
    request(`/admin/kyc?status=${status}${cursor ? `&cursor=${cursor}` : ''}`),

  kycDecision: (driverId: string, status: 'verified' | 'rejected', rejectionReason?: string) =>
    request(`/admin/kyc/${driverId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ status, rejectionReason }),
    }),

  getBookings: (status?: string, cursor?: string) =>
    request(`/admin/bookings?${status ? `status=${status}&` : ''}${cursor ? `cursor=${cursor}` : ''}`),

  getDrivers: (kycStatus?: string, cursor?: string) =>
    request(`/admin/drivers?${kycStatus ? `kycStatus=${kycStatus}&` : ''}${cursor ? `cursor=${cursor}` : ''}`),

  suspendDriver: (driverId: string) =>
    request(`/admin/drivers/${driverId}/suspend`, { method: 'POST' }),

  getCustomers: (cursor?: string) =>
    request(`/admin/customers?${cursor ? `cursor=${cursor}` : ''}`),
};
