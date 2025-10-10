import React from 'react';

const BookmarkIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled = false, className = '' }) => {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M5 3a2 2 0 00-2 2v12l7-3 7 3V5a2 2 0 00-2-2H5z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V20l-7-3-7 3V5.507c0-1.108.806-2.057 1.907-2.185A48.507 48.507 0 0112 3c1.884 0 3.754.108 5.593.322z" />
    </svg>
  );
};

export default BookmarkIcon;
