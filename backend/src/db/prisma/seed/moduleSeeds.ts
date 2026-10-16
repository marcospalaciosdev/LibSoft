export const moduleSeeds = [
    {
        name: 'books',
        permissions: [
            { name: 'read', description: 'View books catalog.' },
            { name: 'create', description: 'Create books and copies.' },
            { name: 'update', description: 'Update book data.' },
            { name: 'delete', description: 'Delete books and copies.' },
        ],
    },
    {
        name: 'loans',
        permissions: [
            { name: 'read', description: 'View active and historic loans.' },
            { name: 'create', description: 'Register new loans.' },
            { name: 'return', description: 'Register book returns.' },
            { name: 'delete', description: 'Delete loans when allowed.' },
        ],
    },
    {
        name: 'borrowers',
        permissions: [
            { name: 'read', description: 'View borrowers.' },
            { name: 'create', description: 'Create borrowers.' },
            { name: 'update', description: 'Update borrowers.' },
            { name: 'delete', description: 'Delete borrowers.' },
        ],
    },
    {
        name: 'users',
        permissions: [
            { name: 'read', description: 'View system users.' },
            { name: 'create', description: 'Create new users.' },
            { name: 'update', description: 'Update users and roles.' },
            { name: 'delete', description: 'Delete users.' },
            { name: 'update_status', description: 'Update user status.' },
        ],
    },
    {
        name: 'settings',
        permissions: [
            { name: 'read', description: 'View global settings.' },
            { name: 'update', description: 'Update global settings.' },
        ],
    },
    {
        name: 'maintenance',
        permissions: [
            { name: 'read', description: 'View maintenance options.' },
            { name: 'backup', description: 'Create backups.' },
            { name: 'restore', description: 'Restore backups.' },
        ],
    },
    {
        name: 'audit',
        permissions: [
            { name: 'read', description: 'View audit data.' },
        ],
    },
    {
        name: 'help',
        permissions: [
            { name: 'read', description: 'View help and FAQ content.' },
            { name: 'update', description: 'Manage help and FAQ content.' },
        ],
    },
    {
        name: 'roles',
        permissions: [
            { name: 'read', description: 'View roles and permissions.' },
            { name: 'create', description: 'Create new roles.' },
            { name: 'update', description: 'Update roles and permissions.' },
            { name: 'delete', description: 'Delete roles.' },
        ],
    },
    {
        name: 'library_profile',
        permissions: [
            { name: 'read', description: 'View library profile.' },
            { name: 'update', description: 'Update library profile.' },
        ],
    },
] as const;
