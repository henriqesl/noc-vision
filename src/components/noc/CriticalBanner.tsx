import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CriticalBannerProps {
  criticalCount: number;
  offlineCount: number;
}

export function CriticalBanner({ criticalCount, offlineCount }: CriticalBannerProps) {
  if (criticalCount === 0 && offlineCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-noc-critical/50 bg-noc-critical/10 noc-critical-glow p-5 lg:p-6 flex items-center gap-5"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-8 w-8 lg:h-10 lg:w-10 text-noc-critical animate-pulse-dot" />
        <div>
          <p className="text-lg lg:text-xl font-bold text-noc-critical">ALERTAS CRÍTICOS</p>
          <p className="text-sm text-muted-foreground">Ação imediata necessária</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl lg:text-5xl font-bold font-mono text-noc-critical">{criticalCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Críticos</p>
        </div>
        <div className="text-center">
          <p className="text-4xl lg:text-5xl font-bold font-mono text-noc-critical">{offlineCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Offline</p>
        </div>
      </div>
    </motion.div>
  );
}
