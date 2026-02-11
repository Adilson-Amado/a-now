import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';

interface SyncStatusProps {
  isOnline?: boolean;
  lastSync?: Date | null;
  syncInProgress?: boolean;
  onSync?: () => Promise<void>;
}

export function SyncStatus({ 
  isOnline = navigator.onLine,
  lastSync = null,
  syncInProgress = false,
  onSync 
}: SyncStatusProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSync = async () => {
    if (!onSync || isRefreshing || syncInProgress) return;
    
    setIsRefreshing(true);
    try {
      await onSync();
      toast.success('Dados sincronizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao sincronizar dados');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (syncInProgress || isRefreshing) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return WifiOff;
    if (syncInProgress || isRefreshing) return RefreshCw;
    return CheckCircle;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncInProgress || isRefreshing) return 'Sincronizando...';
    return 'Sincronizado';
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min atrás`;
    if (hours < 24) return `${hours} h atrás`;
    return `${days} dias atrás`;
  };

  const StatusIcon = getStatusIcon();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Sincronização de Dados
          </div>
          <Badge 
            variant={isOnline ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Offline
              </>
            )}
          </Badge>
        </CardTitle>
        <CardDescription>
          Mantém seus dados seguros e sincronizados entre dispositivos
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-3">
            <motion.div
              animate={(syncInProgress || isRefreshing) ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, repeat: (syncInProgress || isRefreshing) ? Infinity : 0, ease: "linear" }}
            >
              <StatusIcon className={`h-5 w-5 ${getStatusColor()}`} />
            </motion.div>
            <div>
              <p className="font-medium">{getStatusText()}</p>
              <p className="text-sm text-muted-foreground">
                Última sincronização: {formatLastSync()}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleSync}
            disabled={!isOnline || syncInProgress || isRefreshing || !onSync}
            size="sm"
            variant="outline"
            className="gap-1"
          >
            {(syncInProgress || isRefreshing) ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sincronizar
              </>
            )}
          </Button>
        </div>

        {/* Sync Progress */}
        {(syncInProgress || isRefreshing) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso da sincronização</span>
              <span>Processando...</span>
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Backup Automático
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Seus dados são salvos na nuvem automaticamente
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Sincronização Multi-dispositivo
              </span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              Acesse seus dados de qualquer lugar
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Modo Offline
              </span>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Continue trabalhando mesmo sem internet
            </p>
          </div>
        </div>

        {/* Last Sync Details */}
        {lastSync && (
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Detalhes da última sincronização</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {lastSync.toLocaleDateString('pt-PT')}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastSync.toLocaleTimeString('pt-PT')}
              </p>
            </div>
          </div>
        )}

        {/* Offline Warning */}
        {!isOnline && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20">
            <CloudOff className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">
                Modo Offline Ativado
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Você está offline. As alterações serão sincronizadas quando a conexão for restaurada.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
