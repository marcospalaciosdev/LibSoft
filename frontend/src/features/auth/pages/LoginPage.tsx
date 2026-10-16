import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@/shared/components/ui';
import { APP_BRAND_GRADIENT_CLASSNAME, DEFAULT_FRONTEND_ROUTE, getFirstAccessibleRoute } from '@/shared/constants';
import { useAuth } from '@/hooks/useAuth';
import { firstCap } from '@/shared/utils/firstCap';
import { useTranslation } from 'react-i18next';
import { LibsoftLogotype } from '@/shared/components/brand/LibsoftLogotype';
import { LibsoftIsotype } from '@/shared/components/brand/LibsoftIsotype';
import type { DataStatus } from '@LibSoft/shared-types';

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const [error, setError] = useState('');

  const [loginStatus, setLoginStatus] = useState<DataStatus>('idle');

  const handleSubmit = async () => {
    if (!formData.identifier.trim() || !formData.password.trim()) {
      setError(firstCap(t('auth.login.errors.empty')));
      return;
    }
    try {
      setError('');
      setLoginStatus('loading');
      const loggedUser = await login(formData);
      setLoginStatus('success');
      const targetRoute = getFirstAccessibleRoute((perm) => {
        const [mod, act] = perm.split('.');
        return Boolean(mod && act && loggedUser?.permissions?.[mod]?.[act]);
      }) || DEFAULT_FRONTEND_ROUTE;
      navigate(targetRoute, { replace: true });
    } catch (err: any) {
      setError(err?.data?.message || 'Credenciales inv?lidas. Verific? tu email y contrase?a.');
      setLoginStatus('error');
    }
  };

  return (
    <div className="relative flex h-full items-center justify-center overflow-y-auto bg-[rgb(var(--color-bg-tertiary))] px-4 py-8">
      <Button className="absolute top-6 left-6 material-symbols-outlined text-(length:--fs-icon-lg) cursor-pointer"
        onClick={() => navigate('/cta')}
        variant="ghost"
      >
        arrow_back
      </Button>

      <div className="w-full max-w-md animate-fade-in overflow-hidden rounded-2xl bg-[rgb(var(--color-bg))] shadow-xl">
        <div className={`${APP_BRAND_GRADIENT_CLASSNAME} px-8 py-9 text-white sm:px-10`}>
          <div className="mb-8 flex items-center gap-3">
            <LibsoftLogotype sizeInPx={45} />
            <LibsoftIsotype fontSizeInPx={20} color='rgb(255,255,255)' className='font-semibold' />
          </div>
          <h1 className="text-2xl font-bold">
            {firstCap(t('auth.login.title'))}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            {firstCap(t('auth.login.subtitle'))}.
          </p>
        </div>

        <div className="p-8 sm:p-10">
          <div className="space-y-5">
            <Input
              id="email"
              label={{ content: firstCap(t('auth.login.inputs.email.label')) }}
              inputType="text"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={firstCap(t('auth.login.inputs.email.placeholder'))}
              inputClassName="rounded-md border-transparent bg-[rgb(var(--color-bg-tertiary))] text-[length:var(--fs-body-sm)]"
              orientation="vertical"
            />

            <Input
              id="password"
              label={{ content: firstCap(t('auth.login.inputs.password.label')) }}
              inputType="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="********"
              inputClassName="rounded-md border-transparent bg-[rgb(var(--color-bg-tertiary))] text-[length:var(--fs-body-sm)]"
              orientation="vertical"
            />

            {error && (
              <div className="animate-fade-in rounded-md border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={loginStatus === 'loading'}
              className="mt-2 w-full rounded-md py-3"
              rightIcon={<span className="material-symbols-outlined text-lg">arrow_forward</span>}
            >
              {firstCap(t('auth.actions.login'))}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
