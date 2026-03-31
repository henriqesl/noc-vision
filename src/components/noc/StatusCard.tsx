import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'critical';
  className?: string;
}

const variantStyles = {
  default: 'border-border',
  success: 'border-noc-ok/30 noc-glow',
  warning: 'border-noc-warning/30 noc-warning-glow',
  critical: 'border-noc-critical/30 noc-critical-glow',
};

const iconVariantStyles = {
  default: 'text-primary',
  success: 'text-noc-ok',
  warning: 'text-noc-warning',
  critical: 'text-noc-critical',
};

export function StatusCard({ title, value, subtitle, icon, variant = 'default', className }: StatusCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border bg-card p-5 transition-all',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className={cn('h-5 w-5', iconVariantStyles[variant])}>{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold font-mono tracking-tight text-foreground">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}
