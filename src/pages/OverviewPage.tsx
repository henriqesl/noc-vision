import { useOutletContext } from 'react-router-dom';
import { useNocData } from '@/hooks/use-noc-data';
import { StatusCard } from '@/components/noc/StatusCard';
import { GroupSummaryCard } from '@/components/noc/GroupSummaryCard';
import { AlertRow } from '@/components/noc/AlertRow';
import { Monitor, MonitorOff, AlertTriangle, CheckCircle } from 'lucide-react';

export default function OverviewPage() {
  const data = useOutletContext<ReturnType<typeof useNocData>>();

  const criticalAlerts = data.alerts.filter(a => a.severity === 'critical');
  const warningAlerts = data.alerts.filter(a => a.severity === 'warning');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Dispositivos Online"
          value={data.onlineCount}
          subtitle={`de ${data.totalCount} total`}
          icon={<Monitor className="h-5 w-5" />}
          variant="success"
        />
        <StatusCard
          title="Dispositivos Offline"
          value={data.offlineCount}
          icon={<MonitorOff className="h-5 w-5" />}
          variant={data.offlineCount > 0 ? 'critical' : 'default'}
        />
        <StatusCard
          title="Alertas Ativos"
          value={criticalAlerts.length + warningAlerts.length}
          subtitle={`${criticalAlerts.length} críticos`}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={criticalAlerts.length > 0 ? 'critical' : warningAlerts.length > 0 ? 'warning' : 'default'}
        />
        <StatusCard
          title="Saúde Geral"
          value={data.totalCount > 0 ? `${Math.round((data.onlineCount / data.totalCount) * 100)}%` : '—'}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Status por Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.groups.map((group, i) => (
            <GroupSummaryCard key={group.id} group={group} index={i} />
          ))}
        </div>
      </div>

      {data.alerts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Alertas Recentes</h2>
          <div className="space-y-2 max-h-[400px] overflow-auto pr-2">
            {data.alerts.slice(0, 10).map((alert, i) => (
              <AlertRow key={alert.id} alert={alert} index={i} />
            ))}
          </div>
        </div>
      )}

      {data.allDevices.filter(d => d.status === 'offline').length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-noc-critical mb-3">⚠ Dispositivos Offline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.allDevices.filter(d => d.status === 'offline').map((device, i) => {
              const groupName = data.groups.find(g => g.id === device.group)?.name || device.group;
              return (
                <div key={device.id} className="rounded-lg border border-noc-critical/30 bg-noc-critical/5 p-3 noc-critical-glow">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-noc-critical animate-pulse-dot" />
                    <span className="text-sm font-semibold text-foreground">{device.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{groupName} · {device.ip}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
