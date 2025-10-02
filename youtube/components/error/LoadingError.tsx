import React from 'react';

interface LoadingErrorProps {
  onRetry: () => void;
  message?: string;
}

const LoadingError: React.FC<LoadingErrorProps> = ({ onRetry, message = "Oops! Something went wrong while fetching data." }) => (
  <div className="bg-slate-800 border border-slate-700 text-slate-300 px-6 py-8 rounded-lg text-center shadow-lg" role="alert">
     <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h3 className="mt-4 text-lg font-bold text-white">An Error Occurred</h3>
    <p className="mt-2 text-sm">{message}</p>
    <button
      onClick={onRetry}
      className="mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition"
    >
      Try Again
    </button>
  </div>
);

export default LoadingError;
