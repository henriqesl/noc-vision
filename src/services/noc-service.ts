// NOC Data Service — abstraction layer with Zabbix integration + mock fallback

import { isZabbixConfigured, fetchHosts, fetchTriggers, fetchItems, ITEM_KEYS } from './zabbix-api';
import { generateMockData, type ClientGroup, type Alert, type Device, type AlertSeverity } from '@/lib/mock-data';

export interface NocSnapshot {
  groups: ClientGroup[];
  alerts: Alert[];
}

// --- Zabbix → NOC mapping ---

function mapZabbixPriority(priority: string): AlertSeverity {
  const p = parseInt(priority, 10);
  if (p >= 4) return 'critical';  // high, disaster
  if (p >= 2) return 'warning';   // warning, average
  return 'info';
}

async function fetchFromZabbix(): Promise<NocSnapshot> {
  const [hosts, triggers] = await Promise.all([
    fetchHosts(),
    fetchTriggers(),
  ]);

  // Group hosts by their first Zabbix host group
  const groupMap = new Map<string, { id: string; name: string; devices: Device[] }>();

  for (const host of hosts) {
    const groupName = host.groups?.[0]?.name || 'Sem Grupo';
    const groupId = host.groups?.[0]?.groupid || 'no-group';

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, { id: groupId, name: groupName, devices: [] });
    }

    // Try to fetch key items for this host
    let cpu: number | undefined;
    let memory: number | undefined;
    let disk: number | undefined;
    let latency = 0;

    try {
      const items = await fetchItems(host.hostid, [
        ...ITEM_KEYS.CPU,
        ...ITEM_KEYS.MEMORY,
        ...ITEM_KEYS.DISK,
        ...ITEM_KEYS.PING,
      ]);

      for (const item of items) {
        const val = parseFloat(item.lastvalue);
        if (ITEM_KEYS.CPU.some(k => item.key_.startsWith(k))) cpu = val;
        if (ITEM_KEYS.MEMORY.some(k => item.key_.startsWith(k))) memory = val;
        if (ITEM_KEYS.DISK.some(k => item.key_.startsWith(k))) disk = val;
        if (item.key_.startsWith('icmppingsec')) latency = Math.round(val * 1000);
      }
    } catch {
      // Items fetch failed, continue with defaults
    }

    const isOffline = host.available === '2';

    const device: Device = {
      id: host.hostid,
      name: host.name || host.host,
      type: 'server', // Zabbix doesn't have a direct type mapping
      group: groupId,
      status: isOffline ? 'offline' : 'online',
      ip: host.host,
      latency,
      uptime: isOffline ? 0 : 99.9,
      cpu,
      memory,
      disk,
      lastSeen: new Date().toISOString(),
      offlineSince: isOffline ? new Date().toISOString() : undefined,
    };

    groupMap.get(groupId)!.devices.push(device);
  }

  const groups: ClientGroup[] = Array.from(groupMap.values());

  const alerts: Alert[] = triggers.map((t, i) => ({
    id: `zabbix-${t.triggerid}`,
    device: t.hosts?.[0]?.name || 'Desconhecido',
    group: t.groups?.[0]?.name || 'Sem Grupo',
    message: t.description,
    severity: mapZabbixPriority(t.priority),
    timestamp: new Date(parseInt(t.lastchange, 10) * 1000).toISOString(),
    acknowledged: false,
  }));

  alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity] || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return { groups, alerts };
}

// --- Public API ---

export async function fetchNocData(): Promise<NocSnapshot> {
  if (isZabbixConfigured()) {
    try {
      return await fetchFromZabbix();
    } catch (error) {
      console.warn('[NOC] Zabbix API failed, falling back to mock data:', error);
    }
  }

  // Fallback: mock data
  return generateMockData();
}
