import { useState, useEffect, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input, Spinner } from '@/shared/components/ui';
import { firstCap } from '@/shared/utils/firstCap';

interface BackupPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'export' | 'import';
  targetPath: string;
  onSubmit: (password: string) => Promise<void>;
  isLoading?: boolean;
}

export function BackupPasswordModal({
  isOpen,
  onClose,
  mode,
  targetPath,
  onSubmit,
  isLoading = false,
}: BackupPasswordModalProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(firstCap(t('auth.login.errors.passwordRequired') || 'Ingrese su contraseña'));
      return;
    }

    try {
      setError(null);
      await onSubmit(password);
      onClose();
    } catch (err: any) {
      console.log(err);
      const errMsg = err?.message || String(err);
      setError(errMsg);
    }
  };

  const isExportMode = mode === 'export';
  const fileName = targetPath ? targetPath.split(/[/\\]/).pop() : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => { } : onClose}
      title={
        isExportMode
          ? firstCap(t('maintenance.systemBackup.exportPasswordTitle'))
          : firstCap(t('maintenance.systemBackup.importPasswordTitle'))
      }
      subtitle={
        isExportMode
          ? firstCap(t('maintenance.systemBackup.exportPasswordSubtitle'))
          : firstCap(t('maintenance.systemBackup.importPasswordSubtitle'))
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        {targetPath && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[rgb(var(--color-bg-secondary))] border border-[rgb(var(--color-border-soft))] text-xs text-[rgb(var(--color-text-muted))]">
            <span className="material-symbols-outlined text-base">folder_open</span>
            <span className="truncate font-mono">{fileName || targetPath}</span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Input
            label={<span className='text-xs'>{firstCap(t('maintenance.systemBackup.passwordLabel'))}</span>}
            inputType="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder={'··········'}
            autoFocus
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 flex items-start gap-2">
            <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
            <span className="text-xs text-red-500 font-medium">{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[rgb(var(--color-border-soft))]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            isDisabled={isLoading}
          >
            {firstCap(t('common.actions.cancel') || 'Cancelar')}
          </Button>

          <Button
            type="submit"
            variant="primary"
            isDisabled={isLoading || !password.trim()}
            className="min-w-30"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                <span>
                  {isExportMode
                    ? firstCap(t('maintenance.systemBackup.exportBackup.loading') || 'Cifrando...')
                    : firstCap(t('maintenance.dataImport.uploadFile.loading') || 'Descifrando...')}
                </span>
              </span>
            ) : (
              <span>
                {isExportMode
                  ? firstCap(t('maintenance.systemBackup.exportBackup.button') || 'Exportar')
                  : firstCap(t('common.actions.accept') || 'Confirmar e Importar')}
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
