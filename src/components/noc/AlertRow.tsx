import { cn } from '@/lib/utils';
import type { Alert } from '@/lib/mock-data';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

const severityConfig = {
  critical: { icon: AlertCircle, bg: 'bg-noc-critical/10', border: 'border-noc-critical/30', text: 'text-noc-critical', label: 'CRÍTICO' },
  warning: { icon: AlertTriangle, bg: 'bg-noc-warning/10', border: 'border-noc-warning/30', text: 'text-noc-warning', label: 'ALERTA' },
  info: { icon: Info, bg: 'bg-info/10', border: 'border-info/30', text: 'text-info', label: 'INFO' },
};

export function AlertRow({ alert, index = 0 }: { alert: Alert; index?: number }) {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'flex items-center gap-3 rounded-md border p-3 transition-all',
        config.bg, config.border,
        alert.severity === 'critical' && 'noc-critical-glow'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', config.text, alert.severity === 'critical' && 'animate-pulse-dot')} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] font-bold font-mono px-1.5 py-0.5 rounded', config.bg, config.text)}>
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground truncate">{alert.group}</span>
        </div>
        <p className="text-sm font-medium text-foreground mt-0.5 truncate">{alert.device} — {alert.message}</p>
      </div>
      <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: ptBR })}
      </span>
    </motion.div>
  );
}
