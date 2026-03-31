import { fetchHosts, fetchTriggers } from './zabbix-api';
import type { ClientGroup, Alert, Device } from '@/lib/mock-data';

// Função principal consumida pelo hook use-noc-data.ts
export async function fetchNocData() {
  try {
    // 1. Busca os dados reais da API do Zabbix (Paralelo para velocidade)
    const [zabbixHosts, zabbixTriggers] = await Promise.all([
      fetchHosts(),
      fetchTriggers()
    ]);

    // 2. Mapeia as Triggers do Zabbix para o formato de "Alertas" do Dashboard
    // E cria um Set de HostIDs que possuem problemas críticos ativos
    const hostsComProblemaCritico = new Set<string>();

    const alerts: Alert[] = zabbixTriggers.map(trigger => {
      const priority = Number(trigger.priority);
      
      // Define a severidade: priority >= 4 (High/Disaster) vira 'critical' (vermelho)
      const isCritical = priority >= 4;
      const severity = isCritical ? 'critical' : 'warning';
      
      const host = trigger.hosts?.[0];
      const hostName = host?.name || host?.host || 'Desconhecido';

      // Se o problema é crítico (ex: ping caiu), marca o host como "Down"
      if (isCritical && host?.hostid) {
        hostsComProblemaCritico.add(host.hostid);
      }
      
      return {
        id: trigger.triggerid,
        severity: severity,
        message: trigger.description,
        timestamp: new Date(Number(trigger.lastchange) * 1000).toISOString(),
        device: hostName,
      };
    });


    // 3. Mapeia os Hosts do Zabbix para o formato de "ClientGroup" do Dashboard
    const groupsMap = new Map<string, ClientGroup>();

    zabbixHosts.forEach(host => {
      // Pega o primeiro grupo do Zabbix para organizar na tela, ou cria um "Desconhecido"
      const zabbixGroup = host.groups?.[0] || { groupid: 'unknown', name: 'Outros' };

      if (!groupsMap.has(zabbixGroup.groupid)) {
        groupsMap.set(zabbixGroup.groupid, {
          id: zabbixGroup.groupid,
          name: zabbixGroup.name,
          devices: []
        });
      }

      // --- LOGICA DE STATUS ATUALIZADA (O PULO DO GATO) ---
      // 1. O Zabbix Agent (passivo) confirmou que está UP?
      const agentDisponivel = host.available === '1';
      
      // 2. Existe alguma trigger de alta prioridade ativa para este host?
      // (Isso pega o ICMP Down ou Agent Down ativo)
      const possuiAlertaCritico = hostsComProblemaCritico.has(host.hostid);

      let deviceStatus: 'online' | 'offline' | 'warning' = 'online';

      if (possuiAlertaCritico) {
        // Se tem trigger vermelha acesa no Zabbix -> Offline no React
        deviceStatus = 'offline';
      } else if (agentDisponivel || host.available === '0') {
        // Se o agente tá UP ou é desconhecido (ping) e não tem trigger -> Online
        deviceStatus = 'online';
      } else if (host.available === '2') {
        // Agente Zabbix (passivo) confirmou que caiu -> Offline (fallback)
        deviceStatus = 'offline';
      }

      // Adiciona o dispositivo ao grupo correspondente
      groupsMap.get(zabbixGroup.groupid)!.devices.push({
        id: host.hostid,
        name: host.name || host.host,
        ip: host.host, // O campo host costuma guardar o IP ou DNS no Zabbix
        status: deviceStatus,
        group: zabbixGroup.name
      });
    });

    // 4. Retorna no formato exato que o React espera
    return {
      groups: Array.from(groupsMap.values()),
      alerts: alerts
    };

  } catch (error) {
    console.error('[NOC Service] Erro ao mapear dados do Zabbix:', error);
    // Em caso de erro, retorna vazio para não quebrar a tela
    return { groups: [], alerts: [] }; 
  }
}