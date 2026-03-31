// Zabbix API client
// Configure ZABBIX_URL and ZABBIX_TOKEN to enable live data

const ZABBIX_URL = import.meta.env.VITE_ZABBIX_URL || '';
const ZABBIX_TOKEN = import.meta.env.VITE_ZABBIX_TOKEN || '';

export function isZabbixConfigured(): boolean {
  return Boolean(ZABBIX_URL && ZABBIX_TOKEN);
}

let requestId = 1;

async function zabbixRequest<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${ZABBIX_URL}/api_jsonrpc.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json-rpc',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      auth: ZABBIX_TOKEN,
      id: requestId++,
    }),
  });

  if (!response.ok) {
    throw new Error(`Zabbix API HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Zabbix API error: ${data.error.data || data.error.message}`);
  }

  return data.result as T;
}

// --- Types ---

export interface ZabbixHost {
  hostid: string;
  host: string;
  name: string;
  status: string; // '0' = enabled, '1' = disabled
  available: string; // '1' = available, '2' = unavailable
  groups: { groupid: string; name: string }[];
}

export interface ZabbixTrigger {
  triggerid: string;
  description: string;
  priority: string; // '0'-'5' (not classified -> disaster)
  value: string; // '0' = OK, '1' = PROBLEM
  lastchange: string; // unix timestamp
  hosts: { hostid: string; host: string; name: string }[];
  groups?: { groupid: string; name: string }[];
}

export interface ZabbixItem {
  itemid: string;
  hostid: string;
  name: string;
  key_: string;
  lastvalue: string;
  units: string;
  lastclock: string;
}

// --- API Functions ---

export async function fetchHosts(): Promise<ZabbixHost[]> {
  return zabbixRequest<ZabbixHost[]>('host.get', {
    output: ['hostid', 'host', 'name', 'status', 'available'],
    selectGroups: ['groupid', 'name'],
    filter: { status: '0' }, // only enabled hosts
    sortfield: 'name',
  });
}

export async function fetchTriggers(minSeverity = 2): Promise<ZabbixTrigger[]> {
  return zabbixRequest<ZabbixTrigger[]>('trigger.get', {
    output: ['triggerid', 'description', 'priority', 'value', 'lastchange'],
    selectHosts: ['hostid', 'host', 'name'],
    selectGroups: ['groupid', 'name'],
    filter: { value: '1' }, // only active problems
    min_severity: minSeverity,
    sortfield: 'priority',
    sortorder: 'DESC',
    active: true,
    monitored: true,
    skipDependent: true,
  });
}

export async function fetchItems(hostId: string, keys?: string[]): Promise<ZabbixItem[]> {
  const params: Record<string, unknown> = {
    output: ['itemid', 'hostid', 'name', 'key_', 'lastvalue', 'units', 'lastclock'],
    hostids: hostId,
    sortfield: 'name',
  };

  if (keys?.length) {
    params.search = { key_: keys };
    params.searchByAny = true;
  }

  return zabbixRequest<ZabbixItem[]>('item.get', params);
}

// Common item keys for monitoring
export const ITEM_KEYS = {
  CPU: ['system.cpu.util', 'system.cpu.load'],
  MEMORY: ['vm.memory.utilization', 'vm.memory.size'],
  DISK: ['vfs.fs.size', 'vfs.fs.pused'],
  NETWORK: ['net.if.in', 'net.if.out'],
  UPTIME: ['system.uptime'],
  PING: ['icmpping', 'icmppingsec'],
} as const;
