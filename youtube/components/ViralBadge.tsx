import React from 'react';
import { ViralMetrics } from '../utils/viralityAnalytics';

interface ViralBadgeProps {
  metrics: ViralMetrics;
  size?: 'sm' | 'md' | 'lg';
}

const ViralBadge: React.FC<ViralBadgeProps> = ({ metrics, size = 'md' }) => {
  if (!metrics.trendingBadge) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const badges = {
    viral: {
      emoji: '🔥',
      label: 'Viral',
      bgColor: 'bg-gradient-to-r from-red-600 to-orange-600',
      textColor: 'text-white',
    },
    'trending-fast': {
      emoji: '🚀',
      label: 'Trending Fast',
      bgColor: 'bg-gradient-to-r from-orange-600 to-yellow-600',
      textColor: 'text-white',
    },
    rising: {
      emoji: '📈',
      label: 'Rising',
      bgColor: 'bg-gradient-to-r from-green-600 to-teal-600',
      textColor: 'text-white',
    },
    steady: {
      emoji: '📊',
      label: 'Steady',
      bgColor: 'bg-gradient-to-r from-blue-600 to-cyan-600',
      textColor: 'text-white',
    },
  };

  const badge = badges[metrics.trendingBadge];

  return (
    <div
      className={`${badge.bgColor} ${badge.textColor} ${sizeClasses[size]} rounded-full font-bold inline-flex items-center gap-1 shadow-lg animate-pulse`}
      title={`Virality Score: ${metrics.viralityScore}/100`}
    >
      <span>{badge.emoji}</span>
      <span>{badge.label}</span>
    </div>
  );
};

export default ViralBadge;
