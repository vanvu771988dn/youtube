import React from 'react';

interface NetworkErrorProps {
  onRetry: () => void;
}

const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry }) => (
  <div className="bg-slate-800 border border-slate-700 text-slate-300 px-6 py-8 rounded-lg text-center shadow-lg" role="alert">
    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.522c-1.352-.962-2.222-2.5-2.222-4.222a4.5 4.5 0 014.5-4.5c1.722 0 3.26.87 4.222 2.222m-8.444 0A4.5 4.5 0 0012 4.5c1.722 0 3.26.87 4.222 2.222m0 8.444A4.5 4.5 0 0112 19.5c-1.722 0-3.26-.87-4.222-2.222M3 3l18 18" />
    </svg>
    <h3 className="mt-4 text-lg font-bold text-white">Network Connection Error</h3>
    <p className="mt-2 text-sm">Please check your internet connection and try again.</p>
    <button
      onClick={onRetry}
      className="mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition"
    >
      Try Again
    </button>
  </div>
);

export default NetworkError;