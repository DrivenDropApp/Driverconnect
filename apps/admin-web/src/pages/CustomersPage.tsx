import { useState, useEffect } from 'react';
import { adminApi } from '../lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getCustomers()
      .then((data: any) => setCustomers(data.items || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <p className="page-subtitle">All registered customers</p>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} />
          </div>
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
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <p className="empty-state-text">No customers found</p>
                    </div>
                  </td>
                </tr>
              ) : customers.map((c: any) => (
                <tr key={c._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.68rem', fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {c.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{c.phone}</td>
                  <td style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {c.email || '—'}
                  </td>
                  <td>
                    <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                      {c.rating?.toFixed(1) || '5.0'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {c.addresses?.length || 0}
                  </td>
                  <td style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {c.vehicles?.length || 0}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                    {new Date(c.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
