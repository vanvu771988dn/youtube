import React from 'react';
import { ViralMetrics, formatGrowthRate } from '../utils/viralityAnalytics';

interface TrendVelocityProps {
  metrics: ViralMetrics;
  compact?: boolean;
}

const TrendVelocity: React.FC<TrendVelocityProps> = ({ metrics, compact = false }) => {
  const { velocityIndicator, growthRate, engagementRate } = metrics;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className={`${velocityIndicator.color} text-white px-2 py-0.5 rounded flex items-center gap-1`}>
          <span>{velocityIndicator.emoji}</span>
          <span>{formatGrowthRate(growthRate)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Velocity Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Growth Velocity</span>
        <div className={`${velocityIndicator.color} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}>
          <span>{velocityIndicator.emoji}</span>
          <span className="font-semibold">{velocityIndicator.label}</span>
        </div>
      </div>

      {/* Growth Rate */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Views/Hour</span>
        <span className="text-sm font-bold text-cyan-400">{formatGrowthRate(growthRate)}</span>
      </div>

      {/* Engagement Rate */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Engagement</span>
        <span className="text-sm font-bold text-green-400">{engagementRate.toFixed(2)}%</span>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={`${velocityIndicator.color} h-full transition-all duration-500`}
          style={{ width: `${Math.min(100, (growthRate / 50000) * 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default TrendVelocity;
