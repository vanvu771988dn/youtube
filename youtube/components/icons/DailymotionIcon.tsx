import React from 'react';
const DailymotionIcon: React.FC<{size?: number}> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#0066DC"/>
    <text x="50%" y="55%" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" dy=".3em">D</text>
  </svg>
);
export default DailymotionIcon;
