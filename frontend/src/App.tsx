import { AppRouter } from '@/app/router/AppRouter';
import { AppProviders } from '@/app/providers/AppProviders';
import { initLang } from '@/locales/i18n';
import { AccentManager, ThemeManager } from '@/config/useTheme';

import { TimezoneProvider } from './context/TimezoneContext';

export function App() {

  initLang();
  ThemeManager.init();
  AccentManager.init();

  return (
    <AppProviders>
      <TimezoneProvider>
        <AppRouter />
      </TimezoneProvider>
    </AppProviders>
  );
}
