import { useOutletContext, useParams, Link } from 'react-router-dom';
import { useNocData } from '@/hooks/use-noc-data';
import { AlertRow } from '@/components/noc/AlertRow';
import { StatusCard } from '@/components/noc/StatusCard';
import { CriticalBanner } from '@/components/noc/CriticalBanner';
import { ArrowLeft, Monitor, MonitorOff, AlertTriangle, Camera, Server, Wifi, Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

const typeIcon: Record<string, typeof Server> = {
  server: Server,
  camera: Camera,
  switch: Wifi,
  router: Wifi,
  firewall: Server,
};

export default function ClientDetailPage() {
  const data = useOutletContext<ReturnType<typeof useNocData>>();
  const { clientId } = useParams();

  const group = data.groups.find(g => g.id === clientId);
  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">Cliente não encontrado</p>
        <Link to="/" className="text-primary underline mt-4 inline-block">Voltar</Link>
      </div>
    );
  }

  const devices = group.devices;
  const online = devices.filter(d => d.status === 'online').length;
  const offline = devices.filter(d => d.status === 'offline');
  const warnings = devices.filter(d => d.status === 'warning');
  const clientAlerts = data.alerts.filter(a => a.group === group.name);
  const criticalAlerts = clientAlerts.filter(a => a.severity === 'critical');
  const cameras = devices.filter(d => d.type === 'camera');

  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 rounded-lg border border-border hover:bg-accent transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{group.name}</h1>
          <p className="text-sm text-muted-foreground">{devices.length} dispositivos monitorados</p>
        </div>
      </div>

      <CriticalBanner criticalCount={criticalAlerts.length} offlineCount={offline.length} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
        <StatusCard
          title="Online"
          value={online}
          subtitle={`de ${devices.length}`}
          icon={<Monitor className="h-5 w-5" />}
          variant="success"
        />
        <StatusCard
          title="Offline"
          value={offline.length}
          icon={<MonitorOff className="h-5 w-5" />}
          variant={offline.length > 0 ? 'critical' : 'default'}
        />
        <StatusCard
          title="Alertas"
          value={clientAlerts.length}
          subtitle={`${criticalAlerts.length} críticos`}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={criticalAlerts.length > 0 ? 'critical' : clientAlerts.length > 0 ? 'warning' : 'default'}
        />
        <StatusCard
          title="Câmeras"
          value={`${cameras.filter(c => c.status === 'online').length}/${cameras.length}`}
          icon={<Camera className="h-5 w-5" />}
          variant={cameras.some(c => c.status === 'offline') ? 'critical' : 'success'}
        />
      </div>

      {offline.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-noc-critical mb-4 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-noc-critical animate-pulse-dot" />
            Dispositivos Offline ({offline.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offline.map((device: any, i) => {
              const Icon = typeIcon[device.type] || Server;
              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-noc-critical/40 bg-noc-critical/5 p-4 lg:p-5 noc-offline-blink"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-noc-critical" />
                    <span className="font-semibold text-foreground">{device.name}</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-noc-critical animate-pulse-dot ml-auto" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{device.ip}</p>
                  {device.offlineSince && (
                    <p className="text-xs text-noc-critical mt-1 font-mono">
                      Offline há {formatDistanceToNow(new Date(device.offlineSince), { locale: ptBR })}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {clientAlerts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Alertas do Cliente</h2>
          <div className="space-y-2">
            {clientAlerts.map((alert, i) => (
              <AlertRow key={alert.id} alert={alert} index={i} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Todos os Dispositivos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
          {devices.map((device: any, i) => {
            const Icon = typeIcon[device.type] || Server;
            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  'rounded-xl border bg-card p-4 text-center transition-all flex flex-col justify-between items-center',
                  device.status === 'online' ? 'border-noc-ok/20' :
                  device.status === 'warning' ? 'border-noc-warning/30 noc-warning-glow' :
                  'border-noc-critical/40 noc-offline-blink'
                )}
              >
                <div className="flex-1 w-full">
                  <Icon className={cn(
                    'h-7 w-7 lg:h-8 lg:w-8 mx-auto',
                    device.status === 'online' ? 'text-noc-ok' :
                    device.status === 'warning' ? 'text-noc-warning' :
                    'text-noc-critical'
                  )} />
                  <p className="text-xs lg:text-sm font-medium text-foreground mt-2 break-words whitespace-normal leading-tight">{device.name}</p>
                </div>

                {/* Bloco de Métricas (Latência e Uptime) */}
                {(device.latency || device.uptime) && device.status === 'online' && (
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 w-full text-[10px] text-muted-foreground mt-3 border-t border-border/50 pt-2">
                    {device.latency && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" /> {device.latency}
                      </span>
                    )}
                    {device.uptime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {device.uptime}
                      </span>
                    )}
                  </div>
                )}

                <span className={cn(
                  'inline-block mt-2 text-[10px] lg:text-xs font-mono font-bold px-2 py-0.5 rounded',
                  device.status === 'online' ? 'bg-noc-ok/15 text-noc-ok' :
                  device.status === 'warning' ? 'bg-noc-warning/15 text-noc-warning' :
                  'bg-noc-critical/15 text-noc-critical'
                )}>
                  {device.status === 'online' ? 'ONLINE' : device.status === 'warning' ? 'ALERTA' : 'OFFLINE'}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}