import React, { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Bazaar Arcade Runtime Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen tabletop-wood flex items-center justify-center p-4 text-[#1B1B1B]">
          <div className="max-w-md w-full bg-[#FCF9F2] border-2 border-red-500 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-black text-red-700 font-display">Something went wrong</h2>
            <p className="text-xs text-neutral-600">
              The arcade encountered an unexpected error. Click below to refresh and return to the lobby.
            </p>
            <div className="text-[11px] font-mono bg-neutral-100 p-2.5 rounded-xl border border-neutral-300 text-left overflow-x-auto text-red-800">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('bb_room_code');
                localStorage.removeItem('bb_player_token');
                window.location.reload();
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-sm shadow cursor-pointer"
            >
              Reload & Clear Room
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
