import { fetchHosts, fetchTriggers, fetchProxies, fetchMetrics } from './zabbix-api';
import type { ClientGroup, Alert } from '@/lib/mock-data';

export async function fetchNocData() {
  try {
    // 1. Busca Hosts, Triggers e Métricas ao mesmo tempo
    const [zabbixHosts, zabbixTriggers, zabbixMetrics] = await Promise.all([
      fetchHosts(),
      fetchTriggers(),
      fetchMetrics(['icmppingsec', 'system.uptime'])
    ]);

    // 2. Busca os Proxies de forma ISOLADA
    let zabbixProxies: any[] = [];
    try {
      zabbixProxies = await fetchProxies();
    } catch (proxyError) {
      console.warn('[NOC Service] Falha ao procurar proxies.', proxyError);
    }

    // --- PROCESSAMENTO DE MÉTRICAS (LATÊNCIA E UPTIME) ---
    const metricsMap = new Map<string, { latency?: string, uptime?: string }>();
    if (zabbixMetrics) {
      zabbixMetrics.forEach(item => {
        if (!metricsMap.has(item.hostid)) {
          metricsMap.set(item.hostid, {});
        }
        
        const hostMetrics = metricsMap.get(item.hostid)!;

        if (item.key_ === 'icmppingsec') {
          // Zabbix devolve o ping em segundos (ex: 0.012). Multiplicamos para ms.
          const ms = (parseFloat(item.lastvalue) * 1000).toFixed(0);
          hostMetrics.latency = `${ms}ms`;
        } else if (item.key_ === 'system.uptime') {
          // Zabbix devolve em segundos totais
          const seconds = parseInt(item.lastvalue, 10);
          const days = Math.floor(seconds / 86400);
          const hours = Math.floor((seconds % 86400) / 3600);
          hostMetrics.uptime = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
        }
      });
    }

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

    const groupsMap = new Map<string, ClientGroup>();

    // 3. Processa os HOSTS Normais
    zabbixHosts.forEach(host => {
      const nomeLower = (host.name || host.host).toLowerCase();
      
      if (nomeLower.includes('proxy')) return;

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

      // Procura se tem métricas para este host
      const hostMetrics = metricsMap.get(host.hostid) || {};

      groupsMap.get(zabbixGroup.groupid)!.devices.push({
        id: host.hostid,
        name: host.name || host.host,
        ip: host.host, 
        status: deviceStatus,
        group: zabbixGroup.name,
        type: deviceType,
        latency: hostMetrics.latency, // AQUI ADICIONAMOS A LATÊNCIA
        uptime: hostMetrics.uptime,   // AQUI ADICIONAMOS O UPTIME
      });
    });

    // 4. Processa os PROXIES NATIVOS
    if (zabbixProxies && zabbixProxies.length > 0) {
      const proxyGroupId = 'native-proxies-group';
      const tempoAtual = Math.floor(Date.now() / 1000); 

      zabbixProxies.forEach(proxy => {
        const lastAccess = Number(proxy.lastaccess);
        
        if (lastAccess === 0 || String(proxy.status) === '3') return; 

        let cleanName = (proxy.name || proxy.host || 'Proxy Zabbix')
          .replace(/^(zabbix_proxy_|zabbix_proxy|proxy_zabbix_|proxy_)/gi, '')
          .replace(/_/g, ' ').trim();
        cleanName = cleanName.replace(/\b\w/g, l => l.toUpperCase());
        const finalProxyName = cleanName ? `Proxy ${cleanName}` : 'Proxy Zabbix';

        let proxyStatus: 'online' | 'offline' | 'warning' = 'online';
        if ((tempoAtual - lastAccess) > 180) proxyStatus = 'offline'; 

        // Para os proxies, o Uptime é o tempo desde o último acesso
        const diferencaSegundos = tempoAtual - lastAccess;
        const lastSeen = diferencaSegundos < 60 ? 'Agora' : `${Math.floor(diferencaSegundos/60)}m atrás`;

        if (!groupsMap.has(proxyGroupId)) {
          groupsMap.set(proxyGroupId, { id: proxyGroupId, name: '[BASE] Zabbix Proxies', devices: [] });
        }

        groupsMap.get(proxyGroupId)!.devices.push({
          id: `proxy-${proxy.proxyid}`,
          name: finalProxyName,
          ip: 'API Nativa', 
          status: proxyStatus,
          group: '[BASE] Zabbix Proxies',
          type: 'server',
          latency: lastSeen, // Usamos o campo latência para mostrar o "Last Seen" dos proxies
        });
      });
    }

    // 5. Ordenações
    groupsMap.forEach(group => {
      group.devices.sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
    });

    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    return { groups: sortedGroups, alerts: alerts };

  } catch (error) {
    console.error('[NOC Service] Erro ao mapear dados:', error);
    return { groups: [], alerts: [] }; 
  }
}