const fs = require('fs');

function replaceFile(file, ObjectReplacements) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [search, replace] of ObjectReplacements) {
        content = content.replaceAll(search, replace);
    }
    fs.writeFileSync(file, content);
}

const BR = '-[rgb(var(--color-primary-))]';

try {
    replaceFile('src/shared/components/ui/Spinner.tsx', [
        [BR, 'text-primary-600']
    ]);
} catch (e) { }

try {
    replaceFile('src/shared/components/ui/Input.tsx', [
        [`focus:${BR}/30`, 'focus:ring-primary-500/30'],
        [`focus:${BR}`, 'focus:border-primary-500']
    ]);
} catch (e) { }

try {
    replaceFile('src/shared/components/ui/Button.tsx', [
        [`${BR} text-white ${BR} active:${BR}`, 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'],
        [`border-2 ${BR} ${BR} hover:bg-primary-50 active:${BR}`, 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-700'],
        [`bg-[rgb(var(--color-surface))] text-surface-800 hover:bg-[rgb(var(--color-border-soft))] active:bg-[rgb(var(--color-border-soft))]`, `bg-secondary text-text hover:bg-border-soft active:bg-border-soft`]
    ]);
} catch (e) { }

try {
    replaceFile('src/shared/components/layout/Sidebar.tsx', [
        [`className="flex items-center justify-center w-9 h-9 rounded-xl ${BR} text-white`, `className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-600 text-white`]
    ]);

    let sb = fs.readFileSync('src/shared/components/layout/Sidebar.tsx', 'utf8');
    sb = sb.replaceAll(`? '${BR}/20 text-[rgb(var(--color-primary-500))] border-[rgb(var(--color-primary-400))]'`, `? 'bg-primary-600/20 text-primary-500 border-primary-400'`);
    fs.writeFileSync('src/shared/components/layout/Sidebar.tsx', sb);
} catch (e) { }

try {
    replaceFile('src/shared/components/layout/Header.tsx', [
        [`focus:${BR}/20`, 'focus:ring-primary-500/20'],
        [`focus:${BR}`, 'focus:border-primary-500'],
        [`rounded-xl ${BR} ${BR} flex items`, `rounded-xl bg-primary-100 text-primary-700 flex items`]
    ]);
} catch (e) { }

try {
    replaceFile('src/features/users/pages/UsersPage.tsx', [
        [`rounded-lg ${BR} ${BR} flex items`, `rounded-lg bg-primary-100 text-primary-700 flex items`]
    ]);
} catch (e) { }

try {
    replaceFile('src/features/dashboard/pages/DashboardPage.tsx', [
        [`bg-primary-50 ${BR}`, `bg-primary-50 text-primary-600`],
        [`group-${BR}`, `group-hover:text-primary-600`]
    ]);
} catch (e) { }

try {
    replaceFile('src/features/borrowers/pages/BorrowersPage.tsx', [
        [`rounded-xl ${BR} ${BR} flex items`, `rounded-xl bg-primary-100 text-primary-700 flex items`]
    ]);
} catch (e) { }

try {
    replaceFile('src/features/auth/pages/LoginPage.tsx', [
        [`rounded-full ${BR}/10`, `rounded-full bg-primary-600/10`],
        [`rounded-2xl ${BR} text-white`, `rounded-2xl bg-primary-600 text-white`],
        [`className="${BR}/70 mt-2"`, `className="text-primary-600/70 mt-2"`],
        [`className="text-sm font-medium ${BR}"`, `className="text-sm font-medium text-primary-700"`],
        [`focus:${BR}/40`, `focus:ring-primary-600/40`],
        [`focus:${BR}`, `focus:border-primary-600`]
    ]);
} catch (e) { }

try {
    replaceFile('src/app/router/AppRouter.tsx', [
        [`font-bold ${BR}"`, `font-bold text-primary-600"`],
        [`py-2 ${BR} text-white rounded-xl ${BR}`, `py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700`]
    ]);
} catch (e) { }


