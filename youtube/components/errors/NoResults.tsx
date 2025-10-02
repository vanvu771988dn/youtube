import React from 'react';

const NoResults: React.FC = () => (
  <div className="text-center py-16">
    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10a.01.01 0 01.01-.01z" />
    </svg>
    <h2 className="mt-4 text-xl font-semibold text-slate-300">No Videos Found</h2>
    <p className="text-slate-400 mt-2">Try adjusting your filters or search terms.</p>
  </div>
);

export default NoResults;