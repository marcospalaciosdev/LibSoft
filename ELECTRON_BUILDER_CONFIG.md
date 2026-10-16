# Configuración electron-builder para Windows

## Paso 1: Agregar esta sección a package.json

Reemplaza la sección `"build"` existente (o agrégala si no existe) con esto:

```json
{
  "name": "libsoft",
  "version": "1.0.0",
  "description": "Sistema de gestión de biblioteca - Desktop App",
  "main": "electron/dist-electron/main.js",
  
  "scripts": {
    "dev:frontend": "npm run dev --prefix frontend",
    "dev:backend": "npm run dev --prefix backend",
    "dev:electron": "wait-on http://localhost:3001 tcp:localhost:5000 && tsc -p electron/tsconfig.json && electron .",
    "dev": "concurrently -k -p \"[{name}]\" -c \"cyan.bold,yellow.bold,magenta.bold\" -n \"FRONTEND,BACKEND,ELECTRON\" \"npm:dev:frontend\" \"npm:dev:backend\" \"npm:dev:electron\"",
    "build:frontend": "npm run build --prefix frontend",
    "build:backend": "npm run build --prefix backend",
    "build:electron": "tsc -p electron/tsconfig.json",
    "build": "npm run build:frontend && npm run build:backend && npm run build:electron",
    "build:all": "npm run build:frontend && npm run build:backend && npm run build:electron",
    "dist": "npm run build:all && electron-builder --win --publish never",
    "dist:portable": "npm run build:all && electron-builder --win --portable",
    "dist:installer": "npm run build:all && electron-builder --win --nsis"
  },

  "build": {
    "appId": "com.libsoft.app",
    "productName": "LibSoft",
    "artifactName": "${productName}-${version}.${ext}",
    
    "directories": {
      "buildResources": "resources",
      "output": "dist"
    },

    "files": [
      "electron/dist-electron/**/*",
      "backend/dist/**/*",
      "backend/node_modules/**/*",
      "backend/prisma/**/*",
      "resources/**/*",
      "!node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme,test,tests,*.d.ts}"
    ],

    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": [
            "x64"
          ]
        },
        {
          "target": "portable",
          "arch": [
            "x64"
          ]
        }
      ],
      "certificateFile": null,
      "certificatePassword": null,
      "icon": "resources/app.ico",
      "signingHashAlgorithms": [
        "sha256"
      ]
    },

    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "LibSoft",
      "installerIcon": "resources/app.ico",
      "uninstallerIcon": "resources/app.ico",
      "installerHeader": "resources/installer-header.bmp",
      "installerSidebar": "resources/installer-sidebar.bmp"
    },

    "portable": {
      "artifactName": "${productName}-${version}-portable.${ext}"
    }
  }
}
```

## Paso 2: Crear archivos de recursos

### resources/app.ico (Requerido)

1. **Opción A: Generar online (FÁCIL)**
   - Ir a https://icoconvert.com/
   - Subir un PNG 256x256 con tu logo
   - Descargar app.ico
   - Copiar a `resources/app.ico`

2. **Opción B: Desde PNG con ImageMagick (Terminal)**
   ```bash
   npm install -g imagemagick
   convert logo.png -define icon:auto-resize=256,128,96,64,48,32,16 resources/app.ico
   ```

3. **Opción C: Usar placeholder temporalmente**
   ```bash
   mkdir -p resources
   # Usar cualquier .ico disponible o crear uno simple
   cp /path/to/any/icon.ico resources/app.ico
   ```

### Estructura esperada:

```
LibSoft/
├── resources/
│   ├── app.ico              ← Icono de la aplicación (256x256+)
│   ├── app-uninstall.ico    ← Icono desinstalar (opcional, puede ser igual)
│   ├── installer-header.bmp ← Header del instalador (opcional, 150x57)
│   ├── installer-sidebar.bmp ← Sidebar del instalador (opcional, 164x314)
│   └── pgsql/               ← PostgreSQL embebido
│       ├── bin/
│       ├── lib/
│       └── share/
├── electron/
│   ├── dist-electron/       ← Compilado (después de build)
│   └── modules/
├── backend/
│   ├── dist/                ← Compilado (después de build)
│   ├── node_modules/
│   └── prisma/
└── frontend/
    └── dist/                ← Compilado (después de build)
```

## Paso 3: Verificar directorios compilados

Antes de generar el .exe, asegurate que existen:

```bash
# Backend compilado
ls -la backend/dist/app.js

# Electron compilado
ls -la electron/dist-electron/main.js

# Frontend compilado
ls -la frontend/dist/index.html

# PostgreSQL
ls -la resources/pgsql/bin/postgres.exe
```

## Paso 4: Generar ejecutables

### Opción A: Ambas versiones (recomendado)

```bash
npm run dist
```

**Output:**
- `dist/LibSoft-1.0.0.exe` (Portable)
- `dist/LibSoft-Setup-1.0.0.exe` (Instalador)

### Opción B: Solo portable (rápido para testing)

```bash
npm run dist:portable
```

**Output:**
- `dist/LibSoft-1.0.0-portable.exe`

### Opción C: Solo instalador

```bash
npm run dist:installer
```

**Output:**
- `dist/LibSoft-Setup-1.0.0.exe`

## Paso 5: Probando

```bash
# Test portable directamente
./dist/LibSoft-1.0.0.exe

# Test instalador
./dist/LibSoft-Setup-1.0.0.exe
```

## Opciones avanzadas (para después)

### Code Signing con certificado

Si tienes certificado `.pfx`:

```json
{
  "win": {
    "certificateFile": "C:/path/to/certificate.pfx",
    "certificatePassword": "tu_password_aqui",
    "signingHashAlgorithms": ["sha256"]
  }
}
```

### Auto-Update setup

```json
{
  "publish": {
    "provider": "github",
    "owner": "tu_usuario",
    "repo": "LibSoft"
  }
}
```

### Reducir tamaño

```json
{
  "files": [
    "electron/dist-electron/**/*",
    "backend/dist/**/*",
    "backend/node_modules/**/*",
    "backend/prisma/**/*",
    "resources/**/*",
    "!node_modules/*/{CHANGELOG.md,README.md,test,tests}"
  ],
  "asarUnpack": [
    "backend/**/*",
    "resources/pgsql/**/*"
  ]
}
```

## Troubleshooting

### Error: "Prisma CLI not found"
- Solución: `npm run build:backend` antes de `npm run dist`

### Error: "app.ico not found"
- Solución: Crear `resources/app.ico` primero
- Usar generador online si no tienes

### Error: "PostgreSQL binaries not found"
- Solución: Verificar `resources/pgsql/` existe
- En desarrollo está en `./resources/pgsql`

### .exe muy grande (>500MB)
- Solución: Remover node_modules innecesarios
- Usar `npm prune --production` en backend

## Documentación oficial

- [Electron-builder](https://www.electron.build/)
- [NSIS (Instalador Windows)](https://nsis.sourceforge.io/)
- [Electron Code Signing](https://www.electron.build/code-signing)
