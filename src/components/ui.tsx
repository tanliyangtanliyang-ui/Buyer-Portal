import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Trend } from '@/data/mockData';

export function Sparkline({ data, color = '#16a34a' }: { data: number[]; color?: string }) {
  const w = 100;
  const h = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const area = `0,${h} ${pts.join(' ')} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r={2.5} fill={color} />
    </svg>
  );
}

export function TrendIndicator({ trend, value }: { trend: Trend; value: string }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const tone =
    trend === 'up'
      ? 'text-brand-600 bg-brand-50'
      : trend === 'down'
      ? 'text-red-500 bg-red-50'
      : 'text-earth-500 bg-earth-100';
  return (
    <span className={`chip ${tone}`}>
      <Icon className="w-3 h-3" />
      {value}
    </span>
  );
}

export function Badge({ tone, children }: { tone: 'green' | 'amber' | 'blue' | 'red' | 'gray'; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    green: 'bg-brand-100 text-brand-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-sky-100 text-sky-700',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}

export function FreshnessMeter({ value, label }: { value: number; label?: string }) {
  const tone =
    value >= 90 ? { text: 'text-brand-600', bg: 'bg-brand-500', label: 'Excellent' } : value >= 80 ? { text: 'text-lime-600', bg: 'bg-lime-500', label: 'Good' } : { text: 'text-amber-600', bg: 'bg-amber-500', label: 'Fair' };
  return (
    <div className="w-full">
      {label && <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-brand-700/60">{label}</span>
        <span className={`text-xs font-bold ${tone.text}`}>{value}% · {tone.label}</span>
      </div>}
      <div className="h-2.5 w-full rounded-full bg-brand-100 overflow-hidden">
        <div
          className={`h-full ${tone.bg} rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ProgressBar({ value, tone = 'bg-brand-500' }: { value: number; tone?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-brand-100 overflow-hidden">
      <div className={`h-full ${tone} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-800">{title}</h2>
        {subtitle && <p className="text-sm text-brand-700/50 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
