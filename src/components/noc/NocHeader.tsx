import { RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NocHeaderProps {
  lastUpdate: Date;
  isRefreshing: boolean;
  onRefresh: () => void;
  onlineCount: number;
  offlineCount: number;
  totalCount: number;
}

export function NocHeader({ lastUpdate, isRefreshing, onRefresh, onlineCount, offlineCount, totalCount }: NocHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          <span className="text-primary">Oxy</span> Dashboard
        </h1>
        <div className="hidden md:flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-noc-ok" /> {onlineCount}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full bg-noc-critical', offlineCount > 0 && 'animate-pulse-dot')} /> {offlineCount}
          </span>
          <span className="text-muted-foreground">/ {totalCount}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono">{format(lastUpdate, 'HH:mm:ss', { locale: ptBR })}</span>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary text-foreground text-xs font-medium hover:bg-accent transition-colors"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
          Atualizar
        </button>
      </div>
    </header>
  );
}
