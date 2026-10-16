# 📚 LibSoft — Sistema de Gestión Bibliotecaria

<p align="center">
  <b>Sistema de gestión integral para bibliotecas escolares e institucionales</b><br/>
  Aplicación de escritorio nativa (Electron) y plataforma Web construida con React, Express, Prisma y PostgreSQL.
</p>

<p align="center">
  <img src="resources/libsoft-logo-nobg.png" width="200" height="200">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-43.0-47A248?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-6.16-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

---

## 🌟 Características Principales

### 📖 Gestión del Catálogo de Libros y Ejemplares
- **Catálogo detallado**: Registro completo de títulos, autores, editoriales, código de barras/inventario, año de publicación e idioma.
- **Clasificación Dewey (CDD / UDC)**: Integración con el Sistema de Clasificación Decimal Dewey (más de 990 categorías verificadas) para organizar las colecciones.
- **Gestión de ejemplares**: Control individual del estado de cada copia (Disponible, Prestado, En reparación, Pérdida).

### 👥 Gestión de Lectores y Socios
- **Perfiles completos**: Datos de contacto, direcciones, teléfonos e identificación de socios.
- **Historial de lecturas**: Registro histórico de préstamos tanto activos como inactivos por socio.
- **Reportes individuales en PDF**: Exportación del historial de préstamos del socio en PDF listo para imprimir.

### 🔄 Préstamos y Devoluciones
- **Control de morosidad y vencimientos**: Identificación en tiempo real de préstamos activos, devueltos y vencidos.
- **Emisión de recibos y comprobantes**: Generación automática de recibos de préstamo en formato PDF con diseño institucional.
- **Procesamiento de devoluciones**: Registro de devoluciones con opción de notas y evaluación de estado del libro.

### 🔐 Seguridad y Control de Usuarios
- **Sistema de Roles y Permisos Granulares**: Asignación de permisos por módulo (Crear, Editar, Eliminar, Administrar Usuarios, Respaldo).
- **Autenticación segura**: Sesiones con bcrypt y protección de rutas en frontend y backend.
- **Registro de auditoría (Audit Logs)**: Trazabilidad de acciones clave realizadas por los operadores de la biblioteca.

### 📊 Métricas y Analíticas
- **Panel interactivo (Dashboard)**: Visualización de métricas clave (total de libros, lectores activos, préstamos del mes, tasa de devolución).
- **Gráficos dinámicos**: Gráficos interactivos de tendencias y distribución por categorías.

### 🛠️ Mantenimiento, Respaldos y Modos
- **PostgreSQL Embebido Portable**: Descarga e inicialización automática de servidor PostgreSQL sin necesidad de instalaciones globales previas en Windows.
- **Sistema de Backups**: Creación y restauración de copias de seguridad de la base de datos protegidas por contraseña.
- **Soporte Multitema**: Selección de temas visuales (Claro, Oscuro, Dracula, Nord, Sepia, Alto Contraste).
- **Soporte Multilingüe (i18n)**: Interfaz adaptable a español e inglés.

---

## 🛠️ Arquitectura del Proyecto

LibSoft está estructurado como un **Monorepo** con paquetes desacoplados y compartidos:

```
LibSoft/
├── frontend/              # Aplicación Web (React 19 + Vite + Tailwind CSS v4 + Zustand)
├── backend/               # Servidor API REST (Express 5 + Prisma ORM 6 + Zod)
├── electron/              # Wrapper de Escritorio (Electron 43) + Gestor de PostgreSQL embebido
├── shared/
│   └── shared-types/      # Paquete de tipos de TypeScript compartidos entre Frontend y Backend
├── resources/             # Binarios y datos estáticos (PostgreSQL embebido)
├── scripts/               # Scripts auxiliares de descarga de entorno y utilidades
└── package.json           # Configuración de workspaces de npm y scripts raíz
```

---

## 🚀 Tecnologías Utilizadas

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4 | Interfaz de usuario reactiva, moderna y de alto rendimiento. |
| **Estado y Rutas** | Zustand, React Router 7 | Gestión de estado global ligera y enrutamiento SPA. |
| **PDF y Reportes** | jsPDF, jsPDF-AutoTable, HTML2Canvas | Generación de comprobantes y recibos de préstamos en PDF. |
| **Backend** | Node.js, Express 5, TypeScript, Zod | API RESTful robusta con validación de esquemas estricta. |
| **Base de Datos** | PostgreSQL 16, Prisma ORM 6 | ORM moderno con migraciones con tipado estático. |
| **Desktop** | Electron 43 | Aplicación de escritorio nativa ejecutable en Windows. |
| **Monorepo** | npm Workspaces, Concurrently | Ejecución simultánea y gestión modular de dependencias. |

---

## 💻 Requisitos Previos

Asegúrate de contar con los siguientes requisitos en tu sistema:

- **Node.js**: `v18.0.0` o superior (se recomienda `v20+`).
- **npm**: `v9.0.0` o superior.
- **Sistema Operativo**: Windows 10/11 (para la integración automática del binario embebido de PostgreSQL), macOS o Linux.

---

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/LibSoft.git
cd LibSoft
```

### 2. Instalar dependencias del monorepo
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la carpeta `backend/` tomando como referencia `backend/.env.example`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/libsoft?schema=public"
SESSION_SECRET="tu_clave"
NODE_ENV="development"
```

### 4. Inicializar la Base de Datos y Seeding
Puedes descargar los binarios de PostgreSQL y sembrar la base de datos automáticamente:

```bash
# Descargar binarios de PostgreSQL embebido (si aplica)
node scripts/download-pg.js

# Generar cliente de Prisma e inicializar esquema
npm run prisma:generate

# Cargar datos iniciales y clasificadores
npm run db:bootstrap
```

---

## 🏃 Modo Desarrollo

Para iniciar todos los servicios del proyecto en paralelo (Frontend + Backend + Electron):

```bash
npm run dev
```

O si prefieres iniciar los módulos por separado:

```bash
# Solo Frontend (http://localhost:3001)
npm run dev:frontend

# Solo Backend API (http://localhost:5000)
npm run dev:backend

# Solo Electron (Ventana de Escritorio)
npm run dev:electron
```

---

## 📦 Compilación y Producción

Para compilar todos los paquetes del monorepo (Frontend, Backend y Electron):

```bash
npm run build
```

---

## 🤝 Contribución

1. Haz un **Fork** del proyecto.
2. Crea una rama para tu función (`git checkout -b feature/NuevaFuncionalidad`).
3. Realiza tus cambios y haz **Commit** (`git commit -m 'feat: Añadir nueva funcionalidad'`).
4. Haz un **Push** a la rama (`git push origin feature/NuevaFuncionalidad`).
5. Abre un **Pull Request**.

---

## 📄 Licencia

Este proyecto está bajo la Licencia [ISC](LICENSE).