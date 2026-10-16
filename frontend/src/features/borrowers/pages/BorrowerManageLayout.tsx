import { useEffect, useRef, useState } from 'react';
import { useParams, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';
import type { UpdateBorrowerDTO, DataStatus } from "@Libsoft/shared-types";
import { borrowersApi } from '../api/borrowers.api';

import { APP_BRAND_GRADIENT_CLASSNAME } from '@/shared/constants';

import {
    Button,
    Spinner,
} from '@/shared/components/ui';
import { ErrorState } from '@/shared/components/feedback';
import { cn } from '@/shared/utils';
import { BorrowerHistoryReportModal } from '../components/BorrowerHistoryReportModal';

const createInitialBorrowerFormData = (): UpdateBorrowerDTO => ({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    status: 'enabled',
    dni: '',
    phone: '',
    createdAt: '',
    id: '',
});

interface NavBtn {
    name: string;
    route: string;
    icon: string;
}

export function BorrowerManageLayout() {
    const { id } = useParams();
    const location = useLocation();

    const [pageStatus, setPageStatus] = useState<DataStatus>('loading');
    const [showDisableReason, setShowDisableReason] = useState<boolean>(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const statusWrapperRef = useRef<HTMLDivElement>(null);
    const formDataRef = useRef<UpdateBorrowerDTO>(createInitialBorrowerFormData());
    const { t } = useTranslation();

    const [formData, setFormData] = useState<UpdateBorrowerDTO>(() => createInitialBorrowerFormData());

    const isLoansPage = location.pathname.endsWith('/loans');

    const NavBtns: NavBtn[] = [
        {
            name: firstCap(t('borrowers.manageBorrowerPage.editBorrower.navLabel', 'Editar Datos')),
            route: "edit",
            icon: "edit_square"
        },
        {
            name: firstCap(t('borrowers.manageBorrowerPage.loans.navLabel', 'Pr?stamos')),
            route: "loans",
            icon: "book_4"
        }
    ];

    const fetchBorrower = async () => {
        try {
            setPageStatus('loading');

            const data = await borrowersApi.getById(id as string);
            const borrowerData = data as UpdateBorrowerDTO;

            setFormData(borrowerData);
            formDataRef.current = borrowerData;
            setPageStatus('success');
        } catch (error) {
            console.error('Error al obtener el socio:', error);
            setPageStatus('error');
        }
    };

    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        fetchBorrower();
    }, [id]);

    useEffect(() => {
        if (!showDisableReason) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (statusWrapperRef.current && !statusWrapperRef.current.contains(event.target as Node)) {
                setShowDisableReason(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [showDisableReason]);

    const getInitials = () => {
        if (!formData.firstName && !formData.lastName) return 'SO';
        return `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase();
    };

    return (
        <div className='flex flex-col p-6 min-h-full animate-fade-in gap-6'>
            {pageStatus === 'loading' ? (
                <div className='min-h-100 w-full flex items-center justify-center'>
                    <Spinner
                        size='lg'
                        color='rgb(var(--color-primary-500))'
                    />
                </div>
            ) : pageStatus === 'error' ? (
                <ErrorState
                    title={firstCap(t('common.errorMessages.error'))}
                    message={firstCap(t('borrowers.manageBorrowerPage.errorLoadingBorrower', { defaultValue: 'No se pudo cargar el socio.' }))}
                    retryLabel={firstCap(t('common.actions.retry'))}
                    onRetry={fetchBorrower}
                />
            ) : pageStatus === 'success' ? (
                <>
                    <div className='flex flex-row items-center justify-between gap-4'>
                        <div>
                            <h1 className='font-semibold text-[rgb(var(--color-text))] text-2xl flex items-center gap-2'>
                                <span className='material-symbols-outlined text-[rgb(var(--color-primary-500))] text-3xl'>
                                    person
                                </span>
                                {firstCap(t('borrowers.manageBorrowerPage.title'))}
                            </h1>
                            <p className='text-[rgb(var(--color-text-muted))]/60 text-sm border-l-2 border-[rgb(var(--color-primary-500))] pl-6 py-2 -ml-6'>
                                {firstCap(t('borrowers.manageBorrowerPage.subtitle'))}
                            </p>
                        </div>
                        <div className='flex flex-row items-center gap-4'>
                            {isLoansPage &&
                                <Button
                                    variant="ghost"
                                    leftIcon={<span className="material-symbols-outlined text-lg">picture_as_pdf</span>}
                                    className="bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-bg-tertiary))] text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-secondary))] rounded-md shadow-xs transition-colors"
                                    onClick={() => setIsReportModalOpen(true)}
                                >
                                    {firstCap(t('borrowers.historyReport.openButton', 'Exportar historial'))}
                                </Button>
                            }
                        </div>
                    </div>

                    <header className="bg-[rgb(var(--color-bg))] rounded-xl border border-[rgb(var(--color-bg-tertiary))] shadow-sm overflow-hidden transition-all">
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">

                            <div className="flex items-center gap-5">
                                <div className={`${APP_BRAND_GRADIENT_CLASSNAME} w-16 h-16 rounded-full text-white flex items-center justify-center text-xl font-bold shadow-md ring-4 ring-[rgb(var(--color-primary-500))]/10 shrink-0`}>
                                    {getInitials()}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold text-[rgb(var(--color-text))] tracking-tight">
                                            {formData.firstName || formData.lastName
                                                ? `${formData.firstName} ${formData.lastName}`
                                                : 'Cargando Socio...'}
                                        </h2>

                                        <span className={cn(
                                            "px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1.5",
                                            formData.status === 'enabled'
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                        )}>
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                formData.status === 'enabled' ? "bg-emerald-500" : "bg-amber-500"
                                            )} />
                                            {formData.status === 'enabled' ? 'Habilitado' : 'Inhabilitado'}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[rgb(var(--color-text-muted))]">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">badge</span>
                                            DNI: {formData.dni || 'N/A'}
                                        </span>
                                        {formData.phone && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">call</span>
                                                {formData.phone}
                                            </span>
                                        )}
                                        {formData.email && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">mail</span>
                                                {formData.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <nav className="flex border-t border-[rgb(var(--color-bg-tertiary))] bg-[rgb(var(--color-bg-secondary))]/30">
                            {NavBtns.map((btn) => (
                                <NavLink
                                    key={btn.route}
                                    to={`/borrowers/manage/${id}/${btn.route}`}
                                    className="relative"
                                >
                                    {({ isActive }) => (
                                        <div
                                            className={cn(
                                                'flex items-center gap-2 py-3.5 px-4 text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
                                                isActive
                                                    ? 'border-[rgb(var(--color-primary-500))] text-[rgb(var(--color-primary-500))] font-semibold bg-[rgb(var(--color-bg))] shadow-2xs'
                                                    : 'border-transparent text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-tertiary))]/40'
                                            )}
                                        >
                                            <span className="material-symbols-outlined text-lg">
                                                {btn.icon}
                                            </span>
                                            {btn.name}
                                        </div>
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    </header>

                    <main className="w-full flex-1 flex flex-col">
                        <Outlet context={{ formData, setFormData }} />
                    </main>
                </>
            ) : null}

            <BorrowerHistoryReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        </div>
    );
}
