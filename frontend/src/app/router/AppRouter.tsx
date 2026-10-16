
import { useCallback, useEffect, useState } from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';

import { Header, MainLayout } from '@/shared/components/layout';

import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterUserPage } from '@/features/auth/pages/RegisterUserPage';
import { CtaSection } from '@/features/auth/pages/CtaSection';
import { InitialSetupPage } from '@/features/auth/pages/InitialSetupPage';

import { BooksPage } from '@/features/books/pages/BooksPage';
import BookManageLayout from '@/features/books/pages/BookManageLayout'
import { EditBookPage } from '@/features/books/pages/EditBookPage'
import { AddBookPage } from '@/features/books/pages/AddBookPage'
import { LoansPage } from '@/features/loans/pages/LoansPage';
import { CreateLoanPage } from '@/features/loans/pages/CreateLoanPage';
import { DetailedLoansPage } from '@/features/loans/pages/DetailedLoansPage';
import { HandleReturnPage } from '@/features/loans/pages/HandleReturnPage';

import { BorrowersPage } from '@/features/borrowers/pages/BorrowersPage';
import { AddBorrowerPage } from '@/features/borrowers/pages/AddBorrowerPage';
import { BorrowerManageLayout } from '@/features/borrowers/pages/BorrowerManageLayout'
import { EditBorrowerPage } from '@/features/borrowers/pages/EditBorrowerPage'
import { BorrowerLoanHistory } from '@/features/borrowers/pages/BorrowerLoanHistory';

import { BorrowerReceiptTemplate } from '@/features/borrowers/pages/BorrowerReceiptTemplate'

import { UsersPage } from '@/features/users/pages/UsersPage';
import { EditUserPage } from '@/features/users/pages/EditUserPage';

import { SettingsPage } from '@/features/settings/pages/SettingsPage';

import { RolesManageLayout } from '@/features/roles/pages/RolesManageLayout';
import { EditRolesPermissionsPage } from '@/features/roles/pages/EditRolesPermissionsPage'
import { RolesDashboard } from '@/features/roles/pages/RolesDashboard'
import { AddRolePage } from '@/features/roles/pages/AddRolePage';

import { MaintenancePage } from '@/features/maintenance/pages/MaintenancePage';
import { HelpPage } from '@/features/help/pages/HelpPage';
import { AuditTrailPage } from '@/features/audit/pages/AuditTrailPage';

import { BusinessCanvasPage } from '@/features/businessCanvas/pages/BusinessCanvasPage';
import { DEFAULT_FRONTEND_ROUTE, ROUTES, ROUTE_PERMISSIONS } from '@/shared/constants';
import { useAuthStore } from '@/app/store/auth.store';
import { authApi } from '@/features/auth/api/auth.api';
import { Spinner } from '@/shared/components/ui';
import { BookCopiesPage } from '@/features/books/pages/BookCopiesPage';
import { RequirePermission } from './RequirePermission';

function ProtectedRoute({ requiresSetup }: { requiresSetup: boolean }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (requiresSetup) {
    return <Navigate to="/setup" replace />;
  }
  return isAuthenticated ? <MainLayout /> : <Navigate to="/cta" replace />;
}

export function AppRouter() {
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [setupState, setSetupState] = useState({
    isChecking: true,
    requiresSetup: false,
  });

  const loadSetupStatus = useCallback(async () => {
    try {
      const response = await authApi.getSetupStatus();
      setSetupState({
        isChecking: false,
        requiresSetup: response.requiresSetup,
      });
    } catch {
      setSetupState({
        isChecking: false,
        requiresSetup: false,
      });
    }
  }, []);

  useEffect(() => {
    const syncWindowState = async () => {
      if (typeof window !== 'undefined' && window.electronAPI?.isWindowMaximized) {
        const maximized = await window.electronAPI.isWindowMaximized();
        setIsWindowMaximized(maximized);
      }
    };

    syncWindowState();

    const unsubscribe = typeof window !== 'undefined'
      ? window.electronAPI?.onWindowMaximizedStateChanged?.(setIsWindowMaximized)
      : undefined;

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    void loadSetupStatus();
  }, [loadSetupStatus]);

  if (setupState.isChecking) {
    return (
      <div className={`flex h-screen w-full flex-col overflow-hidden ${!isWindowMaximized ? 'rounded-md shadow-md ' : ''}`}>
        <Header />
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[rgb(var(--color-bg-tertiary))]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full flex-col overflow-hidden ${!isWindowMaximized ? 'rounded-md shadow-md ' : ''}`}>
      <Header />
      <div className="min-h-0 flex-1">
        <Routes>
          <Route
            path="/setup"
            element={setupState.requiresSetup
              ? <InitialSetupPage onSetupComplete={loadSetupStatus} />
              : <Navigate to={isAuthenticated ? DEFAULT_FRONTEND_ROUTE : '/login'} replace />}
          />
          <Route
            path="/cta"
            element={setupState.requiresSetup ? <Navigate to="/setup" replace /> : <CtaSection />}
          />
          <Route
            path="/login"
            element={setupState.requiresSetup ? <Navigate to="/setup" replace /> : <LoginPage />}
          />

          <Route path="/register" element={<RegisterUserPage />} />

          <Route element={<ProtectedRoute requiresSetup={setupState.requiresSetup} />}>
            <Route path="/" element={<Navigate to={DEFAULT_FRONTEND_ROUTE} replace />} />

            {/* Books */}
            <Route
              path="/books"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.BOOKS]}>
                  <BooksPage />
                </RequirePermission>
              }
            />
            <Route
              path="/books/add"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.BOOKS_ADD]}>
                  <AddBookPage />
                </RequirePermission>
              }
            />
            <Route
              path="/books/manage/:id"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.BOOKS_MANAGE]}>
                  <BookManageLayout />
                </RequirePermission>
              }
            >
              <Route path="index" element={<Navigate to="edit" replace />} />
              <Route path="edit" element={<EditBookPage />} />
              <Route path="copies" element={<BookCopiesPage />} />
            </Route>

            {/* Loans */}
            <Route
              path="/loans"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.LOANS]}>
                  <LoansPage />
                </RequirePermission>
              }
            />
            <Route
              path="/loans/all"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.LOANS_ALL]}>
                  <DetailedLoansPage />
                </RequirePermission>
              }
            />
            <Route
              path="/loans/new"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.LOANS_NEW]}>
                  <CreateLoanPage />
                </RequirePermission>
              }
            />
            <Route
              path="/loans/return/:id"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.LOANS_RETURN]}>
                  <HandleReturnPage />
                </RequirePermission>
              }
            />

            {/* Borrowers */}
            <Route
              path="/borrowers"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.BORROWERS]}>
                  <BorrowersPage />
                </RequirePermission>
              }
            />
            <Route
              path="/borrowers/new"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.BORROWERS_NEW]}>
                  <AddBorrowerPage />
                </RequirePermission>
              }
            />
            <Route
              path="borrowers/manage/:id"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.BORROWERS_MANAGE]}>
                  <BorrowerManageLayout />
                </RequirePermission>
              }
            >
              <Route index element={<Navigate to="edit" replace />} />
              <Route path="edit" element={<EditBorrowerPage />} />
              <Route path="loans" element={<BorrowerLoanHistory />} />
            </Route>
            <Route
              path="borrowers/report"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.BORROWERS_REPORT]}>
                  <BorrowerReceiptTemplate />
                </RequirePermission>
              }
            />

            {/* Users */}
            <Route
              path="/users"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.USERS]}>
                  <UsersPage />
                </RequirePermission>
              }
            />
            <Route
              path="/users/edit/:id"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.USERS_EDIT]} allowOwnProfile>
                  <EditUserPage />
                </RequirePermission>
              }
            />

            {/* Settings */}
            <Route
              path="/settings"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.SETTINGS]}>
                  <SettingsPage />
                </RequirePermission>
              }
            />
            <Route
              path="/settings/roles"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.SETTINGS_ROLES]}>
                  <RolesManageLayout />
                </RequirePermission>
              }
            >
              <Route index element={<RolesDashboard />} />
              <Route
                path="add"
                element={
                  <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.SETTINGS_ROLES_ADD]}>
                    <AddRolePage />
                  </RequirePermission>
                }
              />
              <Route
                path="permissions"
                element={
                  <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.SETTINGS_ROLES_PERMISSIONS]}>
                    <EditRolesPermissionsPage />
                  </RequirePermission>
                }
              />
            </Route>

            {/* Maintenance */}
            <Route
              path="/maintenance"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.MAINTENANCE]}>
                  <MaintenancePage />
                </RequirePermission>
              }
            />

            {/* Help */}
            <Route
              path="/help"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.HELP]}>
                  <HelpPage />
                </RequirePermission>
              }
            />

            {/* Audit */}
            <Route
              path="/audit"
              element={
                <RequirePermission permissions={ROUTE_PERMISSIONS[ROUTES.AUDITORIA]}>
                  <AuditTrailPage />
                </RequirePermission>
              }
            />

            {/* Business Canvas */}
            <Route path="/business-canvas" element={<BusinessCanvasPage />} />
            <Route path="/canvas" element={<BusinessCanvasPage />} />

          </Route>

          <Route
            path="*"
            element={
              <div className="flex h-full flex-col items-center justify-center bg-[rgb(var(--color-bg-secondary))]">
                <h1 className="text-6xl font-bold text-primary-600">404</h1>
                <p className="text-lg text-[rgb(var(--color-text-muted))]/60 mt-2">Página no encontrada</p>
                <a
                  href={DEFAULT_FRONTEND_ROUTE}
                  className="mt-6 px-6 py-2 bg-primary-600 text-[rgb(var(--color-text))] rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Volver al inicio
                </a>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
