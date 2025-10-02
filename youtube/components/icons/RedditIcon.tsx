import React from 'react';
const RedditIcon: React.FC<{size?: number}> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#FF4500"/>
    <g>
      <circle cx="11.5" cy="17" r="2" fill="#fff"/>
      <circle cx="20.5" cy="17" r="2" fill="#fff"/>
      <ellipse cx="16" cy="22" rx="5" ry="2" fill="#fff"/>
      <circle cx="16" cy="10" r="2" fill="#fff"/>
      <rect x="15" y="6" width="2" height="6" fill="#fff"/>
    </g>
  </svg>
);
export default RedditIcon;
