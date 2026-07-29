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
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1E293B', color: '#F1F5F9',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
