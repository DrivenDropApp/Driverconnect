import { useState, useEffect } from 'react';
import { adminApi } from '../lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getCustomers().then((data: any) => setCustomers(data.items || data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem' }}>Customers</h1>
        <p style={{ fontSize: '0.8rem', color: '#64748B' }}>All registered customers</p>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Rating</th>
                <th>Addresses</th>
                <th>Vehicles</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>No customers found</td></tr>
              ) : customers.map((c: any) => (
                <tr key={c._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #0D9488, #0F766E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {c.name?.charAt(0) || 'C'}
                      </div>
                      <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{c.name}</span>
                    </div>
                  </td>
                  <td>{c.phone}</td>
                  <td style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.email || '—'}</td>
                  <td>⭐ {c.rating?.toFixed(1) || '5.0'}</td>
                  <td>{c.addresses?.length || 0}</td>
                  <td>{c.vehicles?.length || 0}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
