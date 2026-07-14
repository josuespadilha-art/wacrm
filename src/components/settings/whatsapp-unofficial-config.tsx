'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SettingsPanelHead } from './settings-panel-head';
import type { WhatsAppConfig as WhatsAppConfigType } from '@/types';

type ConnectionStatus = 'connected' | 'disconnected' | 'unknown';

export function WhatsAppUnofficialConfig() {
  const supabase = createClient();
  const { user, accountId, loading: authLoading, profileLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfigType | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const loadedAccountIdRef = useRef<string | null>(null);

  const [instanceName, setInstanceName] = useState('');

  const fetchConfig = useCallback(async (acctId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('account_id', acctId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load config row:', error);
      }

      if (data && data.waba_id === 'EVOLUTION') {
        setConfig(data);
        setInstanceName(data.phone_number_id || '');
      } else {
        setConfig(null);
        setInstanceName('');
      }

      if (data && data.waba_id === 'EVOLUTION') {
        try {
          const res = await fetch('/api/whatsapp/config', { method: 'GET' });
          const payload = await res.json();

          if (payload.connected) {
            setConnectionStatus('connected');
            setStatusMessage('');
          } else {
            setConnectionStatus('disconnected');
            setStatusMessage(payload.message || '');
          }
        } catch (err) {
          console.error('Health check failed:', err);
          setConnectionStatus('disconnected');
        }
      } else {
        setConnectionStatus('disconnected');
        setStatusMessage(data ? 'Conta conectada na API Oficial da Meta. Se deseja mudar para Evolution, salve a instância abaixo.' : '');
      }
    } catch (err) {
      console.error('fetchConfig error:', err);
      toast.error('Falha ao carregar as configurações do WhatsApp');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user || !accountId) {
      loadedAccountIdRef.current = null;
      setLoading(false);
      return;
    }
    if (loadedAccountIdRef.current === accountId) return;
    loadedAccountIdRef.current = accountId;
    fetchConfig(accountId);
  }, [authLoading, profileLoading, user?.id, accountId, fetchConfig]);

  async function handleSave() {
    if (!instanceName.trim()) {
      toast.error('O Nome da Instância é obrigatório');
      return;
    }

    try {
      setSaving(true);

      const payload: Record<string, unknown> = {
        phone_number_id: instanceName.trim(),
        waba_id: 'EVOLUTION',
        access_token: 'evolution',
        verify_token: null,
        pin: null,
      };

      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Falha ao salvar a configuração');
        setSaving(false);
        return;
      }

      toast.success('Configuração da Evolution API salva com sucesso! Os fluxos vão disparar pelo seu número conectado.');

      if (accountId) await fetchConfig(accountId);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Falha ao salvar configuração');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    try {
      setTesting(true);
      const res = await fetch('/api/whatsapp/config', { method: 'GET' });
      const payload = await res.json();

      if (payload.connected) {
        setConnectionStatus('connected');
        setStatusMessage('');
        toast.success('Conectado à Evolution API');
      } else {
        setConnectionStatus('disconnected');
        setStatusMessage(payload.message || '');
        toast.error(payload.message || 'Falha na conexão');
      }
    } catch (err) {
      console.error('Test connection error:', err);
      setConnectionStatus('disconnected');
      toast.error('Teste falhou. Verifique sua rede e tente de novo.');
    } finally {
      setTesting(false);
    }
  }

  async function handleReset() {
    if (!confirm('Isto removerá a configuração de WhatsApp atual da sua conta. Deseja continuar?')) {
      return;
    }

    try {
      setResetting(true);
      const res = await fetch('/api/whatsapp/config', { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Falha ao deletar as configurações');
        return;
      }

      toast.success('Configurações removidas com sucesso.');
      setConfig(null);
      setInstanceName('');
      setConnectionStatus('disconnected');
      setStatusMessage('');
    } catch (err) {
      console.error('Reset error:', err);
      toast.error('Falha ao deletar as configurações');
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <section className="animate-in fade-in-50 duration-200">
        <SettingsPanelHead
          title="WhatsApp (Evolution)"
          description="Conecte seu WhatsApp lendo o QR Code pela API da Evolution"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="WhatsApp (Não Oficial)"
        description="Gerencie a conexão do seu WhatsApp com a Evolution API para enviar fluxos automáticos."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">

        <Alert className="bg-card border-border">
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <CheckCircle2 className="size-4 text-primary" />
            ) : (
              <XCircle className="size-4 text-red-500" />
            )}
            <AlertTitle className="text-foreground mb-0">
              {connectionStatus === 'connected' ? 'Instância Conectada' : 'Não conectado'}
            </AlertTitle>
          </div>
          <AlertDescription className="text-muted-foreground">
            {connectionStatus === 'connected'
              ? 'Seus fluxos e respostas estão configurados para rodar via Evolution API.'
              : statusMessage ||
                'Preencha o nome da instância e salve para vincular a Evolution API ao seu CRM.'}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Credenciais da Evolution API</CardTitle>
            <CardDescription className="text-muted-foreground">
              Digite o nome exato da instância que você criou no painel da sua Evolution API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nome da Instância</Label>
              <Input
                placeholder="Ex: visuno-teste"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configuração'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || !config}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {testing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Zap className="size-4" />
                Testar Conexão
              </>
            )}
          </Button>
          {config && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={resetting}
              className="border-red-900 text-red-400 hover:text-red-300 hover:bg-red-950/40"
            >
              {resetting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Resetando...
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" />
                  Desconectar
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground text-base">Instruções de Uso</CardTitle>
            <CardDescription className="text-muted-foreground">
              Siga os passos para ativar o motor de fluxos usando seu WhatsApp não oficial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
             <div className="space-y-2">
               <h3 className="font-semibold text-foreground">Passo 1: Criar a Instância</h3>
               <p>Acesse o painel da Evolution API e crie uma nova instância para o seu número de WhatsApp.</p>
             </div>
             <div className="space-y-2">
               <h3 className="font-semibold text-foreground">Passo 2: Ler o QR Code</h3>
               <p>Leia o QR Code com o aplicativo do WhatsApp no celular que deseja conectar.</p>
             </div>
             <div className="space-y-2">
               <h3 className="font-semibold text-foreground">Passo 3: Salvar no Visuno</h3>
               <p>Coloque o Nome exato da Instância que você escolheu no campo ao lado e clique em Salvar Configuração. Pronto! O sistema já enviará mensagens por ela.</p>
             </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </section>
  );
}
