import { useOutletContext } from 'react-router-dom';
import { useNocData } from '@/hooks/use-noc-data';
import { DeviceCard } from '@/components/noc/DeviceCard';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMemo } from 'react';
import { Server, Network, Activity } from 'lucide-react';

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

  const infraServers = data.allDevices.filter(d => 
    d.group.toLowerCase().includes('zabbix') || 
    d.name.toLowerCase().includes('proxy')
  );

  const networkDevices = data.allDevices.filter(d => 
    d.group.toLowerCase().includes('link') || 
    d.group.toLowerCase().includes('rede') ||
    d.name.toLowerCase().includes('router') ||
    d.name.toLowerCase().includes('mikrotik')
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <Activity className="h-6 w-6 text-primary" />
          Saúde do Core (Zabbix)
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Métricas de consumo do Servidor AWS e Proxies</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { key: 'cpu' as const, label: 'Consumo de CPU (%)', color: '#14b8a6' },
            { key: 'memory' as const, label: 'Uso de Memória RAM (%)', color: '#f59e0b' },
            { key: 'network' as const, label: 'Tráfego Zabbix Trapper (Mbps)', color: '#3b82f6' },
          ].map(({ key, label, color }) => (
            <div key={key} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-semibold text-foreground mb-4">{label}</p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }} axisLine={false} tickLine={false} />
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Sessão dos Servidores Zabbix e Proxies */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Servidores & Proxies ({infraServers.length})
          </h2>
          {infraServers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {infraServers.map((d, i) => <DeviceCard key={d.id} device={d} index={i} />)}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl border border-dashed text-muted-foreground bg-accent/20">
              Nenhum Servidor ou Proxy cadastrado no Zabbix com esses nomes.
            </div>
          )}
        </div>

        {/* Sessão dos Links e Roteadores */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Links de Internet e Core Network ({networkDevices.length})
          </h2>
          {networkDevices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {networkDevices.map((d, i) => <DeviceCard key={d.id} device={d} index={i} />)}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl border border-dashed text-muted-foreground bg-accent/20">
              Nenhum Link ou Roteador identificado. Crie os grupos no Zabbix!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}