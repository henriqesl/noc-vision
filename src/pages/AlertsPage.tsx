import { useOutletContext } from 'react-router-dom';
import { useNocData } from '@/hooks/use-noc-data';
import { AlertRow } from '@/components/noc/AlertRow';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function AlertsPage() {
  const data = useOutletContext<ReturnType<typeof useNocData>>();

  const critical = data.alerts.filter(a => a.severity === 'critical');
  const warning = data.alerts.filter(a => a.severity === 'warning');
  const info = data.alerts.filter(a => a.severity === 'info');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-lg border border-noc-critical/30 bg-card px-5 py-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-noc-critical" />
          <div>
            <p className="text-xs text-muted-foreground">Críticos</p>
            <p className="text-2xl font-bold font-mono text-noc-critical">{critical.length}</p>
          </div>
        </div>
        <div className="rounded-lg border border-noc-warning/30 bg-card px-5 py-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-noc-warning" />
          <div>
            <p className="text-xs text-muted-foreground">Alertas</p>
            <p className="text-2xl font-bold font-mono text-noc-warning">{warning.length}</p>
          </div>
        </div>
        <div className="rounded-lg border border-info/30 bg-card px-5 py-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-info" />
          <div>
            <p className="text-xs text-muted-foreground">Info</p>
            <p className="text-2xl font-bold font-mono text-info">{info.length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {data.alerts.map((alert, i) => (
          <AlertRow key={alert.id} alert={alert} index={i} />
        ))}
        {data.alerts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">✅ Nenhum alerta ativo</p>
            <p className="text-sm mt-1">Todos os sistemas operando normalmente</p>
          </div>
        )}
      </div>
    </div>
  );
}
