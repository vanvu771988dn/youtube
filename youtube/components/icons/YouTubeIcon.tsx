
import React from 'react';

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <svg
    className={className}
    viewBox="0 0 28 20"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="YouTube Icon"
  >
    <path
      d="M27.373 3.122c-.34-.962-1.09-1.71-2.053-2.05C23.223.01 14.002.01 14.002.01s-9.221 0-11.318 1.062C1.72 1.412.97 2.16.63 3.122.01 5.32.01 10 .01 10s0 4.68.62 6.878c.34.962 1.09 1.71 2.053 2.05C4.78 19.99 14.002 19.99 14.002 19.99s9.221 0 11.318-1.062c.963-.34 1.713-1.088 2.053-2.05C27.99 14.68 27.99 10 27.99 10s0-4.68-.617-6.878zM11.196 14.248V5.752L18.498 10l-7.302 4.248z"
    ></path>
  </svg>
);

export default YouTubeIcon;
