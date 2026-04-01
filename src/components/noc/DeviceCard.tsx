import { cn } from '@/lib/utils';
import type { Device } from '@/lib/mock-data';
import { Server, Camera, Router, Shield, Network, Wifi, WifiOff, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const typeIcons: Record<string, React.ElementType> = {
  server: Server,
  camera: Camera,
  switch: Network,
  router: Router,
  firewall: Shield,
};

const statusStyles: Record<string, string> = {
  online: 'border-noc-ok/20 hover:border-noc-ok/40',
  warning: 'border-noc-warning/30 noc-warning-glow',
  offline: 'border-noc-critical/30 noc-critical-glow',
};

const statusDot: Record<string, string> = {
  online: 'bg-noc-ok',
  warning: 'bg-noc-warning',
  offline: 'bg-noc-critical',
};

export function DeviceCard({ device, index = 0 }: { device: any; index?: number }) {
  const Icon = typeIcons[device.type] || Server;

  // Função simples para verificar se a latência está alta (para pintar de amarelo)
  const isHighLatency = device.latency && device.latency.includes('ms') && parseInt(device.latency) > 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        'rounded-lg border bg-card p-4 transition-all relative overflow-hidden',
        statusStyles[device.status] || statusStyles.online
      )}
    >
      {device.status === 'offline' && (
        <div className="absolute inset-0 bg-noc-critical/5 animate-pulse" />
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground break-words whitespace-normal">{device.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('h-2 w-2 rounded-full', statusDot[device.status], device.status === 'offline' && 'animate-pulse-dot')} />
          {device.status === 'online' ? (
            <Wifi className="h-3.5 w-3.5 text-noc-ok" />
          ) : device.status === 'offline' ? (
            <WifiOff className="h-3.5 w-3.5 text-noc-critical" />
          ) : (
            <Wifi className="h-3.5 w-3.5 text-noc-warning" />
          )}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground font-mono mt-1 relative z-10">{device.ip}</p>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs relative z-10">
        {device.status !== 'offline' && (device.latency || device.uptime) && (
          <>
            {device.latency && (
              <div>
                <span className="text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3"/> Latência</span>
                <p className={cn('font-mono font-medium', isHighLatency ? 'text-noc-warning' : 'text-foreground')}>
                  {device.latency}
                </p>
              </div>
            )}
            {device.uptime && (
              <div>
                <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> Uptime</span>
                <p className="font-mono font-medium text-foreground">{device.uptime}</p>
              </div>
            )}
          </>
        )}
        
        {device.cpu !== undefined && (
          <>
            <div>
              <span className="text-muted-foreground">CPU</span>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', device.cpu > 80 ? 'bg-noc-critical' : device.cpu > 60 ? 'bg-noc-warning' : 'bg-noc-ok')}
                    style={{ width: `${device.cpu}%` }}
                  />
                </div>
                <span className="font-mono text-[10px]">{device.cpu}%</span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">RAM</span>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', (device.memory ?? 0) > 85 ? 'bg-noc-critical' : (device.memory ?? 0) > 70 ? 'bg-noc-warning' : 'bg-noc-ok')}
                    style={{ width: `${device.memory}%` }}
                  />
                </div>
                <span className="font-mono text-[10px]">{device.memory}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}