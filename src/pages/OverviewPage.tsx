import { useOutletContext, Link } from 'react-router-dom';
import { useNocData } from '@/hooks/use-noc-data';
import { StatusCard } from '@/components/noc/StatusCard';
import { CriticalBanner } from '@/components/noc/CriticalBanner';
import { GroupSummaryCard } from '@/components/noc/GroupSummaryCard';
import { Monitor, MonitorOff, AlertTriangle, CheckCircle } from 'lucide-react';

export default function OverviewPage() {
  const data = useOutletContext<ReturnType<typeof useNocData>>();

  const criticalAlerts = data.alerts.filter(a => a.severity === 'critical');
  const warningAlerts = data.alerts.filter(a => a.severity === 'warning');

  // Filtra a lista apenas com os grupos que queremos mostrar nos cards
  const gruposVisiveis = data.groups.filter(g => 
    g.name.toUpperCase().includes('[BASE]') || 
    g.name.toUpperCase().includes('[CLIENTE]')
  );

  return (
    <div className="space-y-8 lg:space-y-10">
      <CriticalBanner
        criticalCount={criticalAlerts.length}
        offlineCount={data.offlineCount}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
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
        <h2 className="text-xl lg:text-2xl font-semibold text-foreground mb-4 lg:mb-5">Status por Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6">
          {gruposVisiveis.map((group, i) => (
            <Link key={group.id} to={`/cliente/${group.id}`} className="block hover:scale-[1.02] transition-transform">
              <GroupSummaryCard group={group} index={i} />
            </Link>
          ))}
        </div>
      </div>

      {data.allDevices.filter(d => d.status === 'offline').length > 0 && (
        <div>
          <h2 className="text-xl lg:text-2xl font-semibold text-noc-critical mb-4 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-noc-critical animate-pulse-dot" />
            Dispositivos Offline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.allDevices.filter(d => d.status === 'offline').map((device) => {
              const groupName = data.groups.find(g => g.id === device.group)?.name || device.group;
              return (
                <div key={device.id} className="rounded-xl border border-noc-critical/40 bg-noc-critical/5 p-4 lg:p-5 noc-offline-blink">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-noc-critical animate-pulse-dot" />
                    <span className="text-sm lg:text-base font-semibold text-foreground">{device.name}</span>
                  </div>
                  <p className="text-xs lg:text-sm text-muted-foreground mt-1.5">{groupName} · {device.ip}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}