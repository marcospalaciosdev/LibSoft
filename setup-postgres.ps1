# Script PowerShell para copiar PostgreSQL a resources/pgsql

Write-Host "🔍 Buscando PostgreSQL instalado..." -ForegroundColor Cyan

# Posibles ubicaciones de PostgreSQL
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\15",
    "C:\Program Files\PostgreSQL\14",
    "C:\Program Files\PostgreSQL\16",
    "C:\Program Files (x86)\PostgreSQL\15",
    "C:\Program Files (x86)\PostgreSQL\14"
)

$pgPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $pgPath = $path
        Write-Host "✅ Encontrado: $pgPath" -ForegroundColor Green
        break
    }
}

if (-not $pgPath) {
    Write-Host "❌ PostgreSQL no encontrado en:" -ForegroundColor Red
    $possiblePaths | ForEach-Object { Write-Host "   - $_" }
    Write-Host ""
    Write-Host "Para instalar PostgreSQL:" -ForegroundColor Yellow
    Write-Host "  1. Descargar desde: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Instalar (cualquier versión 14+)" -ForegroundColor White
    Write-Host "  3. Ejecutar este script de nuevo" -ForegroundColor White
    exit 1
}

# Crear directorio destino
$outputDir = "resources\pgsql"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Write-Host "📁 Creado directorio: $outputDir" -ForegroundColor Cyan
}

# Copiar binarios
Write-Host ""
Write-Host "📋 Copiando binarios..." -ForegroundColor Cyan

$binSource = Join-Path $pgPath "bin"
$binDest = Join-Path $outputDir "bin"

if (Test-Path $binSource) {
    Copy-Item -Path $binSource -Destination $binDest -Recurse -Force
    Write-Host "✅ Binarios copiados: bin/" -ForegroundColor Green
} else {
    Write-Host "⚠️  bin/ no encontrado en $binSource" -ForegroundColor Yellow
}

# Copiar librerías
$libSource = Join-Path $pgPath "lib"
$libDest = Join-Path $outputDir "lib"

if (Test-Path $libSource) {
    Copy-Item -Path $libSource -Destination $libDest -Recurse -Force
    Write-Host "✅ Librerías copiadas: lib/" -ForegroundColor Green
} else {
    Write-Host "⚠️  lib/ no encontrado en $libSource" -ForegroundColor Yellow
}

# Copiar archivos de datos
$shareSource = Join-Path $pgPath "share"
$shareDest = Join-Path $outputDir "share"

if (Test-Path $shareSource) {
    Copy-Item -Path $shareSource -Destination $shareDest -Recurse -Force
    Write-Host "✅ Datos copiados: share/" -ForegroundColor Green
} else {
    Write-Host "⚠️  share/ no encontrado en $shareSource" -ForegroundColor Yellow
}

# Verificar tamaño
$size = (Get-ChildItem -Path $outputDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "📊 Información:" -ForegroundColor Cyan
Write-Host "   Tamaño total: $('{0:N0}' -f $size) MB" -ForegroundColor White
Write-Host "   Ubicación: $outputDir" -ForegroundColor White
Write-Host ""
Write-Host "✅ PostgreSQL listo para empaquetar!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "  npm run build:all" -ForegroundColor White
Write-Host "  npm run dist" -ForegroundColor White
