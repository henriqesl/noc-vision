import { useState, useEffect, useCallback } from 'react';
import { generateMockData, type ClientGroup, type Alert } from '@/lib/mock-data';

export function useNocData(refreshInterval = 8000) {
  const [groups, setGroups] = useState<ClientGroup[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate API call delay
    setTimeout(() => {
      const data = generateMockData();
      setGroups(data.groups);
      setAlerts(data.alerts);
      setLastUpdate(new Date());
      setIsRefreshing(false);
    }, 300);
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
