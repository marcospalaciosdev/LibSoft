import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui';
import { DEFAULT_FRONTEND_ROUTE, getFirstAccessibleRoute } from '@/shared/constants';
import { useAuth } from '@/hooks/useAuth';
import { firstCap } from '@/shared/utils/firstCap';

interface ForbiddenPageProps {
  title?: string;
  message?: string;
}

export function ForbiddenPage({ title, message }: ForbiddenPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const handleGoHome = () => {
    const targetRoute = getFirstAccessibleRoute(hasPermission) || DEFAULT_FRONTEND_ROUTE;
    navigate(targetRoute, { replace: true });
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center animate-fade-in bg-[rgb(var(--color-bg-secondary))]">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20 shadow-sm">
        <span className="material-symbols-outlined text-4xl">lock</span>
      </div>
      <h1 className="text-5xl font-extrabold text-[rgb(var(--color-text))] tracking-tight">403</h1>
      <h2 className="text-xl font-bold text-[rgb(var(--color-text))] mt-3">
        {title || firstCap(t('common.errors.forbiddenTitle', { defaultValue: 'Acceso denegado' }))}
      </h2>
      <p className="text-sm text-[rgb(var(--color-text-muted))] max-w-90 mt-2 leading-relaxed">
        {message || firstCap(t('common.errors.forbiddenMessage', { defaultValue: 'No cuentas con los permisos requeridos para acceder a esta sección.' }))}
      </p>
      <div className="flex items-center gap-3 mt-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          leftIcon={<span className="material-symbols-outlined text-lg">arrow_back</span>}
        >
          {firstCap(t('common.actions.back', { defaultValue: 'Volver atrás' }))}
        </Button>
        <Button
          variant="primary"
          onClick={handleGoHome}
          leftIcon={<span className="material-symbols-outlined text-lg rounded-md">home</span>}
        >
          {firstCap(t('common.actions.goHome', { defaultValue: 'Ir al inicio' }))}
        </Button>
      </div>
    </div>
  );
}
