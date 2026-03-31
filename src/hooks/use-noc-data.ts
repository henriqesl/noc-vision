import { useState, useEffect, useCallback } from 'react';
import { fetchNocData } from '@/services/noc-service';
import type { ClientGroup, Alert } from '@/lib/mock-data';

export function useNocData(refreshInterval = 8000) {
  const [groups, setGroups] = useState<ClientGroup[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchNocData();
      setGroups(data.groups);
      setAlerts(data.alerts);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('[NOC] Failed to fetch data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  const allDevices = groups.flatMap(g => g.devices);
  const onlineCount = allDevices.filter(d => d.status === 'online').length;
  const offlineCount = allDevices.filter(d => d.status === 'offline').length;
  const warningCount = allDevices.filter(d => d.status === 'warning').length;
  const totalCount = allDevices.length;

  return {
    groups,
    alerts,
    allDevices,
    onlineCount,
    offlineCount,
    warningCount,
    totalCount,
    lastUpdate,
    isRefreshing,
    refresh,
  };
}
