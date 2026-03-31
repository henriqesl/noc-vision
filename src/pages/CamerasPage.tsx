import { useOutletContext } from 'react-router-dom';
import { useNocData } from '@/hooks/use-noc-data';
import { Camera, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function CamerasPage() {
  const data = useOutletContext<ReturnType<typeof useNocData>>();
  const cameras = data.allDevices.filter(d => d.type === 'camera');
  const onlineCams = cameras.filter(c => c.status === 'online').length;
  const offlineCams = cameras.filter(c => c.status === 'offline');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-lg border border-border bg-card px-5 py-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold font-mono text-foreground">{cameras.length}</p>
        </div>
        <div className="rounded-lg border border-noc-ok/20 bg-card px-5 py-3">
          <p className="text-xs text-muted-foreground">Online</p>
          <p className="text-2xl font-bold font-mono text-noc-ok">{onlineCams}</p>
        </div>
        <div className={cn('rounded-lg border bg-card px-5 py-3', offlineCams.length > 0 ? 'border-noc-critical/30 noc-critical-glow' : 'border-border')}>
          <p className="text-xs text-muted-foreground">Offline</p>
          <p className={cn('text-2xl font-bold font-mono', offlineCams.length > 0 ? 'text-noc-critical' : 'text-foreground')}>{offlineCams.length}</p>
        </div>
      </div>

      {offlineCams.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-noc-critical mb-3 flex items-center gap-2">
            <WifiOff className="h-5 w-5" /> Câmeras Offline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {offlineCams.map((cam, i) => {
              const groupName = data.groups.find(g => g.id === cam.group)?.name || cam.group;
              return (
                <motion.div
                  key={cam.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-noc-critical/30 bg-noc-critical/5 p-4 noc-critical-glow"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-noc-critical" />
                    <span className="font-semibold text-foreground">{cam.name}</span>
                    <span className="h-2 w-2 rounded-full bg-noc-critical animate-pulse-dot ml-auto" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{groupName} · {cam.ip}</p>
                  {cam.offlineSince && (
                    <p className="text-xs text-noc-critical mt-2 font-mono">
                      Offline há {formatDistanceToNow(new Date(cam.offlineSince), { locale: ptBR })}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Todas as Câmeras</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {cameras.map((cam, i) => {
            const groupName = data.groups.find(g => g.id === cam.group)?.name || cam.group;
            return (
              <motion.div
                key={cam.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  'rounded-lg border bg-card p-3 text-center transition-all',
                  cam.status === 'online' ? 'border-noc-ok/15' : cam.status === 'warning' ? 'border-noc-warning/30' : 'border-noc-critical/30'
                )}
              >
                <Camera className={cn(
                  'h-8 w-8 mx-auto',
                  cam.status === 'online' ? 'text-noc-ok' : cam.status === 'warning' ? 'text-noc-warning' : 'text-noc-critical'
                )} />
                <p className="text-xs font-medium text-foreground mt-2 truncate">{cam.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{groupName}</p>
                <span className={cn(
                  'inline-block mt-1.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded',
                  cam.status === 'online' ? 'bg-noc-ok/15 text-noc-ok' :
                  cam.status === 'warning' ? 'bg-noc-warning/15 text-noc-warning' :
                  'bg-noc-critical/15 text-noc-critical'
                )}>
                  {cam.status === 'online' ? 'ONLINE' : cam.status === 'warning' ? 'ALERTA' : 'OFFLINE'}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
