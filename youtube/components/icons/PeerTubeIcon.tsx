import React from 'react';
const PeerTubeIcon: React.FC<{size?: number}> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F1680D"/>
    <text x="50%" y="55%" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" dy=".3em">PT</text>
  </svg>
);
export default PeerTubeIcon;
