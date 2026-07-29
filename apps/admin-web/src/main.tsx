import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" toastOptions={{
        duration: 3500,
        style: { background: '#1E293B', color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px' },
      }} />
    </BrowserRouter>
  </React.StrictMode>,
);
