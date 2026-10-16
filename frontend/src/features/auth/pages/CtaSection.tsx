import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';
import {
    Button,
    DropDownMenu,
} from '@/shared/components/ui';
import { APP_NAME } from '@/shared/constants';
import { LibsoftLogotype } from '@/shared/components/brand/LibsoftLogotype';

const langOptions = [
    { value: 'en', label: 'English (US)' },
    { value: 'es', label: 'Español' },
];

export function CtaSection() {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    };

    return (
        <main className="relative h-full text-[rgb(var(--color-text))]">
            <div className="absolute inset-0 bg-[rgb(var(--color-bg-tertiary))]" />
            <div className="relative mx-auto animate-fade-in flex h-full w-7xl items-center p-5 sm:p-8 lg:p-12">
                <div className="grid w-full rounded-4xl bg-[rgb(var(--color-bg))]/95 shadow-2xl backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
                    <section className="flex flex-col justify-between p-8 sm:p-12 lg:p-16">
                        <div>
                            <div className="mb-14 flex items-center gap-3">
                                <LibsoftLogotype sizeInPx={50} />
                                <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
                            </div>

                            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-primary-500))]">
                                {firstCap(t('auth.cta.title'))}
                            </p>
                            <h1 className="max-w-md text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
                                {firstCap(t('auth.cta.subtitle'))}
                            </h1>
                            <p className="mt-6 max-w-md text-base leading-relaxed text-[rgb(var(--color-text-muted))]">
                                {firstCap(t('auth.cta.description'))}
                            </p>
                        </div>

                        <div className="mt-8 flex flex-col mb-5">
                            <div className="flex flex-row gap-3 w-full">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto"
                                    onClick={() => navigate('/login')}
                                    rightIcon={<span className="material-symbols-outlined text-lg">arrow_forward</span>}
                                >
                                    {firstCap(t('auth.cta.login'))}
                                </Button>
                            </div>
                        </div>
                        <DropDownMenu
                            label={<span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">{firstCap(t('settings.preferences.inputs.language'))}</span>}
                            options={langOptions}
                            onSelect={(value) => {
                                changeLanguage(value);
                            }}
                            className='w-full bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text))] rounded-lg text-sm border-none focus:ring-2 focus:ring-[rgb(var(--color-primary-400))] outline-none appearance-none cursor-pointer font-medium transition-colors'
                            fontSize={"14px"}
                            height={'42px'}
                            position='top'
                        >
                            {langOptions.filter((option) => option.value === i18n.language)[0].label || i18n.language}
                        </DropDownMenu>
                    </section>

                    <section className="relative min-h-[19rem] overflow-hidden bg-[rgb(var(--color-primary-900))] rounded-r-[2rem]">
                        <img
                            src="media/images/cta-background.png"
                            className="w-full h-full object-cover saturate-70 contrast-80" alt="" />
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-black/10" />
                        <div className="absolute bottom-8 left-8 right-8 text-white sm:bottom-12 sm:left-12 sm:right-12">
                            <p className="max-w-sm text-lg font-medium leading-snug sm:text-xl">
                                {firstCap(t('auth.cta.motto'))}
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}