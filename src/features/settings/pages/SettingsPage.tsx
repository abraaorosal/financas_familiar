import { useEffect, useRef, useState, type ChangeEventHandler } from 'react';
import type { User } from '@supabase/supabase-js';
import { format, parseISO } from 'date-fns';
import { Download, RefreshCcw, Upload } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { Modal } from '@/shared/components/Modal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { useMeta, usePersons } from '@/shared/hooks/useAppData';
import { clearAllData, exportDataBundle, importDataBundle, removePerson, upsertPerson } from '@/db/repository';
import { forceSeedDatabase } from '@/db/seeds';
import type { Person } from '@/domain/models';
import { PersonForm } from '../components/PersonForm';
import { cloudAuthService, cloudBackupService, cloudSyncService } from '@/sync/cloudSyncService';
import { isSupabaseConfigured } from '@/sync/supabaseClient';
import type { CloudBackupRow } from '@/sync/types';

export const SettingsPage = () => {
  const persons = usePersons();
  const meta = useMeta();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);

  const [importStrategy, setImportStrategy] = useState<'merge' | 'overwrite'>('merge');
  const [message, setMessage] = useState<string>('');
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [cloudBackups, setCloudBackups] = useState<CloudBackupRow[]>([]);
  const [cloudEmail, setCloudEmail] = useState('');
  const [cloudPassword, setCloudPassword] = useState('');
  const [cloudBusy, setCloudBusy] = useState(false);

  const lastImport = meta.find((item) => item.key === 'lastImportAt')?.value;
  const lastCloudSyncAt = meta.find((item) => item.key === 'lastCloudSyncAt')?.value;
  const lastCloudPushAt = meta.find((item) => item.key === 'lastCloudPushAt')?.value;
  const lastCloudPullAt = meta.find((item) => item.key === 'lastCloudPullAt')?.value;

  const refreshCloudState = async () => {
    if (!isSupabaseConfigured) return;

    const user = await cloudAuthService.getCurrentUser();
    setCloudUser(user);

    if (user) {
      const backups = await cloudBackupService.listBackups(20);
      setCloudBackups(backups);
    } else {
      setCloudBackups([]);
    }
  };

  useEffect(() => {
    void refreshCloudState();
  }, []);

  const runCloudAction = async (fn: () => Promise<void>) => {
    setCloudBusy(true);
    try {
      await fn();
      await refreshCloudState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha na operação em nuvem.');
    } finally {
      setCloudBusy(false);
    }
  };

  const triggerExport = async () => {
    const bundle = await exportDataBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `financas-da-casa-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    anchor.click();

    URL.revokeObjectURL(url);
    setMessage('Backup exportado com sucesso.');
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importDataBundle(payload, importStrategy);
      setMessage('Importação concluída com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? `Falha na importação: ${error.message}` : 'Falha na importação.');
    } finally {
      event.target.value = '';
    }
  };

  const clearData = async () => {
    await clearAllData();
    setMessage('Dados locais removidos com sucesso.');
    setIsClearDialogOpen(false);
    setClearConfirmText('');
  };

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Gerencie pessoas, backup e segurança dos dados locais e em nuvem."
      />

      <section className="mb-6 rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="mb-3 font-display text-lg font-semibold">Pessoas</h2>

        {persons.length === 0 ? (
          <EmptyState title="Nenhuma pessoa cadastrada" message="Cadastre pelo menos duas pessoas para segmentar os lançamentos." />
        ) : (
          <ul className="space-y-2">
            {persons.map((person) => (
              <li key={person.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: person.cor }} />
                  <div>
                    <p className="font-semibold text-slate-800">{person.nome}</p>
                    <p className="text-xs text-slate-500">{person.ativo ? 'Ativa' : 'Inativa'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                    onClick={() => {
                      setEditingPerson(person);
                      setIsPersonModalOpen(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
                    onClick={() => setDeletingPerson(person)}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="mt-4 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
          onClick={() => {
            setEditingPerson(null);
            setIsPersonModalOpen(true);
          }}
        >
          Nova pessoa
        </button>
      </section>

      <section className="mb-6 rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Sincronização em nuvem (Supabase)</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
            onClick={() => {
              void runCloudAction(async () => {
                await refreshCloudState();
                setMessage('Estado da nuvem atualizado.');
              });
            }}
            disabled={cloudBusy}
          >
            <RefreshCcw size={13} /> Atualizar
          </button>
        </div>

        <p className="mb-3 text-xs text-slate-500">
          Para compartilhar dados com sua esposa, use o mesmo login de nuvem nos dois aparelhos.
        </p>

        {!isSupabaseConfigured ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para habilitar sincronização entre dispositivos.
          </div>
        ) : !cloudUser ? (
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm md:col-span-1">
              <span className="mb-1 block text-slate-600">E-mail</span>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={cloudEmail}
                onChange={(event) => setCloudEmail(event.target.value)}
                placeholder="seuemail@provedor.com"
              />
            </label>

            <label className="text-sm md:col-span-1">
              <span className="mb-1 block text-slate-600">Senha</span>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={cloudPassword}
                onChange={(event) => setCloudPassword(event.target.value)}
                placeholder="******"
              />
            </label>

            <div className="flex items-end gap-2 md:col-span-1">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                disabled={cloudBusy}
                onClick={() => {
                  void runCloudAction(async () => {
                    await cloudAuthService.signUp(cloudEmail, cloudPassword);
                    setMessage('Cadastro concluído. Confirme seu e-mail no Supabase se necessário e faça login.');
                  });
                }}
              >
                Cadastrar
              </button>
              <button
                type="button"
                className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
                disabled={cloudBusy}
                onClick={() => {
                  void runCloudAction(async () => {
                    await cloudAuthService.signIn(cloudEmail, cloudPassword);
                    setMessage('Login em nuvem realizado com sucesso.');
                  });
                }}
              >
                Entrar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Conectado como <strong>{cloudUser.email}</strong>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
                disabled={cloudBusy}
                onClick={() => {
                  void runCloudAction(async () => {
                    const result = await cloudSyncService.syncNow();
                    setMessage(
                      result.pushed
                        ? 'Sincronização concluída (merge local + upload versionado).'
                        : 'Sincronização concluída. Nenhuma alteração nova para enviar.'
                    );
                  });
                }}
              >
                Sincronizar agora
              </button>

              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                disabled={cloudBusy}
                onClick={() => {
                  void runCloudAction(async () => {
                    await cloudBackupService.uploadBackup('manual-push');
                    setMessage('Backup enviado para nuvem.');
                  });
                }}
              >
                Enviar backup
              </button>

              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                disabled={cloudBusy}
                onClick={() => {
                  void runCloudAction(async () => {
                    const pulled = await cloudBackupService.pullLatest('merge');
                    setMessage(pulled ? 'Backup mais recente importado com merge.' : 'Nenhum backup remoto encontrado.');
                  });
                }}
              >
                Baixar backup mais recente
              </button>

              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                disabled={cloudBusy}
                onClick={() => {
                  void runCloudAction(async () => {
                    await cloudAuthService.signOut();
                    setCloudEmail('');
                    setCloudPassword('');
                    setMessage('Sessão de nuvem encerrada.');
                  });
                }}
              >
                Sair da nuvem
              </button>
            </div>

            <div className="mb-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p>Última sincronização: {lastCloudSyncAt ? format(parseISO(lastCloudSyncAt), 'dd/MM/yyyy HH:mm') : 'nunca'}</p>
              <p>Último envio: {lastCloudPushAt ? format(parseISO(lastCloudPushAt), 'dd/MM/yyyy HH:mm') : 'nunca'}</p>
              <p>Último download: {lastCloudPullAt ? format(parseISO(lastCloudPullAt), 'dd/MM/yyyy HH:mm') : 'nunca'}</p>
            </div>

            <h3 className="mb-2 font-display text-base font-semibold">Histórico de backups na nuvem</h3>

            {cloudBackups.length === 0 ? (
              <EmptyState title="Sem backups remotos" message="Clique em 'Sincronizar agora' para criar o primeiro backup em nuvem." />
            ) : (
              <ul className="space-y-2">
                {cloudBackups.map((backup) => (
                  <li key={backup.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{backup.label}</p>
                      <p className="text-xs text-slate-500">
                        {format(parseISO(backup.created_at), 'dd/MM/yyyy HH:mm')} • Dispositivo {backup.device_id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                        disabled={cloudBusy}
                        onClick={() => {
                          void runCloudAction(async () => {
                            await importDataBundle(backup.payload, 'merge');
                            setMessage('Snapshot importado com merge no banco local.');
                          });
                        }}
                      >
                        Importar (merge)
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
                        disabled={cloudBusy}
                        onClick={() => {
                          void runCloudAction(async () => {
                            await cloudBackupService.restoreBackup(backup.id, 'overwrite');
                            setMessage('Snapshot restaurado com sobrescrita e novo backup de restauração criado.');
                          });
                        }}
                      >
                        Restaurar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section className="mb-6 rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="mb-3 font-display text-lg font-semibold">Backup local (JSON)</h2>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
            onClick={triggerExport}
          >
            <Download size={16} /> Exportar JSON
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
            onClick={triggerImport}
          >
            <Upload size={16} /> Importar JSON
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        <div className="mt-3 text-sm text-slate-600">
          <p className="mb-1">Modo de importação:</p>
          <label className="mr-4 inline-flex items-center gap-1">
            <input
              type="radio"
              checked={importStrategy === 'merge'}
              onChange={() => setImportStrategy('merge')}
            />
            Mesclar
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="radio"
              checked={importStrategy === 'overwrite'}
              onChange={() => setImportStrategy('overwrite')}
            />
            Sobrescrever
          </label>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {lastImport ? `Última importação: ${new Date(lastImport).toLocaleString('pt-BR')}` : 'Nenhuma importação registrada.'}
        </p>
      </section>

      <section className="mb-6 rounded-xl2 border border-rose-200 bg-rose-50/60 p-4 shadow-card">
        <h2 className="mb-2 font-display text-lg font-semibold text-rose-800">Zona de segurança</h2>
        <p className="mb-3 text-sm text-rose-700">
          Limpar os dados remove todo o histórico local. Faça backup local e em nuvem antes.
        </p>

        <button
          type="button"
          className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
          onClick={() => setIsClearDialogOpen(true)}
        >
          Limpar todos os dados
        </button>

        <button
          type="button"
          className="ml-2 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800"
          onClick={async () => {
            await forceSeedDatabase();
            setMessage('Seed de exemplo aplicada.');
          }}
        >
          Reaplicar seed de exemplo
        </button>
      </section>

      {message ? <p className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">{message}</p> : null}

      <Modal
        isOpen={isPersonModalOpen}
        title={editingPerson ? 'Editar pessoa' : 'Nova pessoa'}
        onClose={() => {
          setEditingPerson(null);
          setIsPersonModalOpen(false);
        }}
      >
        <PersonForm
          initialData={editingPerson ?? undefined}
          onSubmit={async (payload) => {
            await upsertPerson({ ...payload, id: editingPerson?.id });
            setEditingPerson(null);
            setIsPersonModalOpen(false);
          }}
          onCancel={() => {
            setEditingPerson(null);
            setIsPersonModalOpen(false);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingPerson)}
        title="Excluir pessoa"
        message="Essa ação remove o cadastro da pessoa. Lançamentos existentes permanecerão no histórico."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deletingPerson) return;
          await removePerson(deletingPerson.id);
          setDeletingPerson(null);
        }}
        onClose={() => setDeletingPerson(null)}
      />

      <Modal isOpen={isClearDialogOpen} title="Confirmação forte" onClose={() => setIsClearDialogOpen(false)}>
        <p className="text-sm text-slate-700">
          Digite <strong>LIMPAR</strong> para confirmar remoção total dos dados.
        </p>
        <input
          type="text"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
          value={clearConfirmText}
          onChange={(event) => setClearConfirmText(event.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            onClick={() => setIsClearDialogOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={clearData}
            disabled={clearConfirmText !== 'LIMPAR'}
          >
            Confirmar limpeza
          </button>
        </div>
      </Modal>
    </div>
  );
};
