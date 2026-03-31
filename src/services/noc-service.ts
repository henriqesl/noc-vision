import { fetchHosts, fetchTriggers } from './zabbix-api';
import type { ClientGroup, Alert } from '@/lib/mock-data';

export async function fetchNocData() {
  try {
    // 1. Busca os dados reais da API do Zabbix (Paralelo para velocidade)
    const [zabbixHosts, zabbixTriggers] = await Promise.all([
      fetchHosts(),
      fetchTriggers()
    ]);

    // 2. Set de HostIDs que possuem problemas críticos ativos
    const hostsComProblemaCritico = new Set<string>();

    const alerts: Alert[] = zabbixTriggers.map(trigger => {
      const priority = Number(trigger.priority);
      
      const isCritical = priority >= 4;
      const severity = isCritical ? 'critical' : 'warning';
      
      const host = trigger.hosts?.[0];
      const hostName = host?.name || host?.host || 'Desconhecido';

      const groupName = trigger.groups?.[0]?.name || 'Desconhecido';

      if (isCritical && host?.hostid) {
        hostsComProblemaCritico.add(host.hostid);
      }
      
      return {
        id: trigger.triggerid,
        severity: severity,
        message: trigger.description,
        timestamp: new Date(Number(trigger.lastchange) * 1000).toISOString(),
        device: hostName,
        group: groupName, 
      };
    });

    // 3. Mapeia os Hosts do Zabbix para o formato de "ClientGroup" do Dashboard
    const groupsMap = new Map<string, ClientGroup>();

    zabbixHosts.forEach(host => {
      const zabbixGroup = host.groups?.[0] || { groupid: 'unknown', name: 'Outros' };

      if (!groupsMap.has(zabbixGroup.groupid)) {
        groupsMap.set(zabbixGroup.groupid, {
          id: zabbixGroup.groupid,
          name: zabbixGroup.name,
          devices: []
        });
      }

      const agentDisponivel = host.available === '1';
      const possuiAlertaCritico = hostsComProblemaCritico.has(host.hostid);

      let deviceStatus: 'online' | 'offline' | 'warning' = 'online';

      if (possuiAlertaCritico) {
        deviceStatus = 'offline';
      } else if (agentDisponivel || host.available === '0') {
        deviceStatus = 'online';
      } else if (host.available === '2') {
        deviceStatus = 'offline';
      }

      // 4. Lógica para definir o TIPO do dispositivo (Os Ícones)
      const nomeLower = (host.name || host.host).toLowerCase();
      const grupoLower = zabbixGroup.name.toLowerCase();
      
      let deviceType: 'server' | 'camera' | 'router' | 'switch' | 'firewall' = 'server';

      if (nomeLower.includes('cam') || grupoLower.includes('cam')) {
        deviceType = 'camera';
      } else if (nomeLower.includes('rot') || nomeLower.includes('rout') || nomeLower.includes('mikrotik') || grupoLower.includes('link') || grupoLower.includes('rede')) {
        deviceType = 'router';
      } else if (nomeLower.includes('sw') || grupoLower.includes('sw')) {
        deviceType = 'switch';
      } else if (nomeLower.includes('fire')) {
        deviceType = 'firewall';
      }

      // Adiciona o dispositivo à lista
      groupsMap.get(zabbixGroup.groupid)!.devices.push({
        id: host.hostid,
        name: host.name || host.host,
        ip: host.host, 
        status: deviceStatus,
        group: zabbixGroup.name,
        type: deviceType, // AQUI: Vírgula correta e variável declarada
      });
    });

    return {
      groups: Array.from(groupsMap.values()),
      alerts: alerts
    };

  } catch (error) {
    console.error('[NOC Service] Erro ao mapear dados do Zabbix:', error);
    return { groups: [], alerts: [] }; 
  }
}