import { useOutletContext } from 'react-router-dom';
import { useNocData } from '@/hooks/use-noc-data';
import { DeviceCard } from '@/components/noc/DeviceCard';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMemo } from 'react';

// Generate fake time-series for charts
function generateTimeSeries(points = 20) {
  return Array.from({ length: points }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    cpu: Math.floor(Math.random() * 40 + 20),
    memory: Math.floor(Math.random() * 30 + 40),
    network: Math.floor(Math.random() * 60 + 10),
  }));
}

export default function InfraPage() {
  const data = useOutletContext<ReturnType<typeof useNocData>>();
  const chartData = useMemo(() => generateTimeSeries(), []);

  const servers = data.allDevices.filter(d => d.type === 'server');
  const networkDevices = data.allDevices.filter(d => ['switch', 'router', 'firewall'].includes(d.type));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Métricas Gerais</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { key: 'cpu' as const, label: 'CPU Médio', color: '#14b8a6' },
            { key: 'memory' as const, label: 'Memória Média', color: '#f59e0b' },
            { key: 'network' as const, label: 'Tráfego de Rede', color: '#3b82f6' },
          ].map(({ key, label, color }) => (
            <div key={key} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-2">{label}</p>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(220 18% 10%)', border: '1px solid hsl(220 14% 18%)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(210 20% 90%)' }}
                  />
                  <Area type="monotone" dataKey={key} stroke={color} fill={`url(#grad-${key})`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Servidores ({servers.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {servers.map((d, i) => <DeviceCard key={d.id} device={d} index={i} />)}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Rede ({networkDevices.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {networkDevices.map((d, i) => <DeviceCard key={d.id} device={d} index={i} />)}
        </div>
      </div>
    </div>
  );
}
