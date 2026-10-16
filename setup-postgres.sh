#!/bin/bash
# Script para descargar PostgreSQL portable para Windows

# Crear directorio
mkdir -p resources/pgsql

# Descargar PostgreSQL 15 Portable para Windows (64-bit)
# Fuente: https://www.enterprisedb.com/download-postgresql-binaries
# O usar versión pre-compilada

echo "Descargando PostgreSQL binarios..."

# Opción 1: Descargar desde URL directa (si existe)
# curl -o pg.zip "https://get.enterprisedb.com/postgresql/postgresql-15.1-windows-x64-binaries.zip"
# unzip pg.zip -d resources/pgsql/

# Opción 2: Copiar desde instalación local (más fácil si ya tienes PG)
if [ -d "C:/Program Files/PostgreSQL/15" ]; then
  echo "Encontrado PostgreSQL en Program Files, copiando..."
  cp -r "C:/Program Files/PostgreSQL/15/bin" resources/pgsql/
  cp -r "C:/Program Files/PostgreSQL/15/lib" resources/pgsql/
  cp -r "C:/Program Files/PostgreSQL/15/share" resources/pgsql/
  echo "✅ PostgreSQL copiado a resources/pgsql/"
else
  echo "❌ PostgreSQL no encontrado en C:/Program Files/PostgreSQL/15"
  echo "Opciones:"
  echo "1. Instalar PostgreSQL desde https://www.postgresql.org/download/windows/"
  echo "2. O descargar binarios portables desde:"
  echo "   https://www.postgresql.org/ftp/source/"
fi

echo "Done!"
