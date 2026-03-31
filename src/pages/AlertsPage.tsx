import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useNocData } from '@/hooks/use-noc-data';
import { AlertRow } from '@/components/noc/AlertRow';

export default function AlertsPage() {
  const data = useOutletContext<ReturnType<typeof useNocData>>();
  
  // 1. Criando os Estados para os Filtros
  const [filtroSeveridade, setFiltroSeveridade] = useState<string>('todos');
  const [filtroCliente, setFiltroCliente] = useState<string>('todos');

  // 2. Extraindo lista única de clientes para o Select
  const clientesUnicos = Array.from(new Set(data.alerts.map(a => a.device.split(' - ')[0])));

  // 3. Aplicando os filtros na lista de alertas
  const alertasFiltrados = data.alerts.filter((alerta) => {
    const passaSeveridade = filtroSeveridade === 'todos' || alerta.severity === filtroSeveridade;
    // Assumindo que o nome do dispositivo começa com o nome do cliente (ex: "Pepsico - Camera 01")
    const passaCliente = filtroCliente === 'todos' || alerta.device.includes(filtroCliente);
    
    return passaSeveridade && passaCliente;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Alertas Ativos</h1>
        
        {/* 4. Os Controles Visuais dos Filtros */}
        <div className="flex gap-3">
          <select 
            className="p-2 rounded-md border bg-background"
            value={filtroSeveridade} 
            onChange={(e) => setFiltroSeveridade(e.target.value)}
          >
            <option value="todos">Todas as Severidades</option>
            <option value="critical">Crítico (Disaster/High)</option>
            <option value="warning">Aviso (Warning/Average)</option>
          </select>

          <select 
            className="p-2 rounded-md border bg-background"
            value={filtroCliente} 
            onChange={(e) => setFiltroCliente(e.target.value)}
          >
            <option value="todos">Todos os Clientes</option>
            {clientesUnicos.map(cliente => (
              <option key={cliente} value={cliente}>{cliente}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Renderizando a lista filtrada em vez da original */}
      <div className="rounded-xl border bg-card">
        {alertasFiltrados.length > 0 ? (
          alertasFiltrados.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum alerta encontrado com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
}