import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function MainLayout() {

  return (
    <div id='main-layout' className={`h-full w-full flex flex-col overflow-hidden`}>
      <main className='flex-1 w-full flex flex-row overflow-hidden relative z-9 bg-[rgb(var(--color-bg-secondary))]'>
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-y-auto animate-fade-in relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}