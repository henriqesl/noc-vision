import { cn } from '@/lib/utils';
import type { ClientGroup } from '@/lib/mock-data';
import { motion } from 'framer-motion';

export function GroupSummaryCard({ group, index = 0 }: { group: ClientGroup; index?: number }) {
  const online = group.devices.filter(d => d.status === 'online').length;
  const offline = group.devices.filter(d => d.status === 'offline').length;
  const warning = group.devices.filter(d => d.status === 'warning').length;
  const total = group.devices.length;
  const healthPct = total > 0 ? Math.round((online / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'rounded-xl border bg-card p-6 lg:p-7 transition-all',
        offline > 0 ? 'border-noc-critical/40 noc-offline-blink' : 'border-border hover:border-primary/30'
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-lg">{group.name}</h3>
        <span className={cn(
          'text-xs font-mono font-bold px-2 py-0.5 rounded',
          healthPct === 100 ? 'bg-noc-ok/15 text-noc-ok' :
          healthPct >= 90 ? 'bg-noc-warning/15 text-noc-warning' :
          'bg-noc-critical/15 text-noc-critical'
        )}>
          {healthPct}%
        </span>
      </div>

      <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden flex">
        {online > 0 && <div className="bg-noc-ok h-full" style={{ width: `${(online / total) * 100}%` }} />}
        {warning > 0 && <div className="bg-noc-warning h-full" style={{ width: `${(warning / total) * 100}%` }} />}
        {offline > 0 && <div className="bg-noc-critical h-full" style={{ width: `${(offline / total) * 100}%` }} />}
      </div>

      <div className="mt-3 flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-noc-ok" />
          <span className="text-muted-foreground">{online} online</span>
        </div>
        {warning > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-noc-warning" />
            <span className="text-muted-foreground">{warning} alerta</span>
          </div>
        )}
        {offline > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-noc-critical animate-pulse-dot" />
            <span className="text-noc-critical font-medium">{offline} offline</span>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{total} dispositivos</p>
    </motion.div>
  );
}
