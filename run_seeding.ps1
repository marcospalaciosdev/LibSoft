# ============================================================================
# SEEDING SCRIPT EXECUTOR - LibSoft Database
# PowerShell Script para ejecutar el seeding de datos de prueba
# ============================================================================

param(
    [string]$DatabaseName = "libsoft",
    [string]$Username = "postgres",
    [string]$Password,
    [string]$Host = "localhost",
    [int]$Port = 5432,
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $Message" -PadRight 49 -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

function Test-PostgreSQLConnection {
    param(
        [string]$Host,
        [int]$Port,
        [string]$Username,
        [string]$Password,
        [string]$Database
    )
    
    Write-Info "Verificando conexión a PostgreSQL..."
    
    $env:PGPASSWORD = $Password
    
    try {
        $output = & psql -h $Host -p $Port -U $Username -d $Database -c "SELECT 1;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Conexión establecida correctamente."
            return $true
        } else {
            Write-Error-Custom "No se pudo conectar a PostgreSQL: $output"
            return $false
        }
    }
    catch {
        Write-Error-Custom "Error al conectar: $_"
        return $false
    }
}

function Get-ScriptPath {
    $scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
    return Join-Path -Path $scriptDir -ChildPath "seeding_script.sql"
}

function Execute-SeedingScript {
    param(
        [string]$ScriptPath,
        [string]$Host,
        [int]$Port,
        [string]$Username,
        [string]$Password,
        [string]$Database,
        [bool]$DryRun,
        [bool]$Verbose
    )
    
    if (-not (Test-Path $ScriptPath)) {
        Write-Error-Custom "Script no encontrado: $ScriptPath"
        return $false
    }
    
    Write-Info "Ruta del script: $ScriptPath"
    
    $env:PGPASSWORD = $Password
    
    try {
        if ($DryRun) {
            Write-Header "MODO DRY RUN - Sin cambios"
            Write-Info "Ejecutando script en modo lectura..."
            Write-Info "Se mostrarán los comandos sin aplicarlos."
        } else {
            Write-Header "EJECUTANDO SEEDING"
            Write-Info "Esto puede tomar 5-10 minutos..."
        }
        
        if ($Verbose) {
            Write-Info "Modo verboso activado"
        }
        
        $psqlArgs = @(
            "-h", $Host
            "-p", $Port
            "-U", $Username
            "-d", $Database
            "-f", $ScriptPath
            "-v", "ON_ERROR_STOP=1"
        )
        
        if ($Verbose) {
            $psqlArgs += "-a"  # Echo commands
        }
        
        # Ejecutar psql
        & psql $psqlArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Script ejecutado exitosamente."
            return $true
        } else {
            Write-Error-Custom "Error al ejecutar el script. Código de error: $LASTEXITCODE"
            return $false
        }
    }
    catch {
        Write-Error-Custom "Error durante la ejecución: $_"
        return $false
    }
}

function Show-Statistics {
    param(
        [string]$Host,
        [int]$Port,
        [string]$Username,
        [string]$Password,
        [string]$Database
    )
    
    Write-Header "ESTADÍSTICAS DE LA BASE DE DATOS"
    
    $env:PGPASSWORD = $Password
    
    $queries = @(
        ("Usuarios", "SELECT COUNT(*) FROM public.users;"),
        ("Prestatarios", "SELECT COUNT(*) FROM public.borrowers;"),
        ("Libros", "SELECT COUNT(*) FROM public.books;"),
        ("Copias de Libros", "SELECT COUNT(*) FROM public.book_copies;"),
        ("Préstamos", "SELECT COUNT(*) FROM public.loans;"),
        ("Copias Prestadas", "SELECT COUNT(*) FROM public.loans_copies WHERE returned = false;"),
        ("Copias Devueltas", "SELECT COUNT(*) FROM public.loans_copies WHERE returned = true;")
    )
    
    foreach ($query in $queries) {
        $label = $query[0]
        $sql = $query[1]
        
        try {
            $result = & psql -h $Host -p $Port -U $Username -d $Database -t -c $sql 2>&1 | Select-String -Pattern "^\s*\d+"
            $count = $result -replace '^\s+', '' -replace '\s+$', ''
            Write-Host "$label`t: $count registros" -ForegroundColor Cyan
        }
        catch {
            Write-Host "$label`t: Error al consultar" -ForegroundColor Red
        }
    }
}

function Check-Integrity {
    param(
        [string]$Host,
        [int]$Port,
        [string]$Username,
        [string]$Password,
        [string]$Database
    )
    
    Write-Header "VERIFICACIÓN DE INTEGRIDAD"
    
    $env:PGPASSWORD = $Password
    
    $checks = @(
        ("Libros sin clasificación Dewey", "SELECT COUNT(*) FROM public.books WHERE dewey_category_id IS NULL;"),
        ("Préstamos sin prestatario", "SELECT COUNT(*) FROM public.loans WHERE borrower_id IS NULL;"),
        ("Préstamos sin usuario", "SELECT COUNT(*) FROM public.loans WHERE user_id IS NULL;")
    )
    
    $allPassed = $true
    
    foreach ($check in $checks) {
        $checkName = $check[0]
        $sql = $check[1]
        
        try {
            $result = & psql -h $Host -p $Port -U $Username -d $Database -t -c $sql 2>&1 | Select-String -Pattern "^\s*\d+"
            $count = $result -replace '^\s+', '' -replace '\s+$', ''
            
            if ([int]$count -eq 0) {
                Write-Success "$checkName: OK"
            } else {
                Write-Error-Custom "$checkName: ENCONTRADOS $count problemas"
                $allPassed = $false
            }
        }
        catch {
            Write-Error-Custom "$checkName: Error al verificar"
            $allPassed = $false
        }
    }
    
    if ($allPassed) {
        Write-Success "Todas las verificaciones pasaron correctamente."
    } else {
        Write-Error-Custom "Se encontraron problemas de integridad."
    }
}

# ============================================================================
# MAIN
# ============================================================================

Write-Header "LIBSOFT - DATABASE SEEDING TOOL"

Write-Info "Parámetros:"
Write-Host "  Database: $DatabaseName"
Write-Host "  Host: $Host"
Write-Host "  Port: $Port"
Write-Host "  Username: $Username"

# Solicitar contraseña si no fue proporcionada
if (-not $Password) {
    $credentials = Get-Credential -UserName $Username -Message "Ingresa tu contraseña de PostgreSQL"
    $Password = $credentials.GetNetworkCredential().Password
}

# Verificar conexión
if (-not (Test-PostgreSQLConnection -Host $Host -Port $Port -Username $Username -Password $Password -Database $DatabaseName)) {
    Write-Error-Custom "No se puede continuar sin conexión a la base de datos."
    exit 1
}

# Obtener ruta del script
$scriptPath = Get-ScriptPath

# Ejecutar seeding
$startTime = Get-Date
$success = Execute-SeedingScript -ScriptPath $scriptPath -Host $Host -Port $Port -Username $Username -Password $Password -Database $DatabaseName -DryRun $DryRun -Verbose $Verbose
$endTime = Get-Date

# Mostrar resultados
if ($success) {
    $duration = $endTime - $startTime
    Write-Success "Tiempo total de ejecución: $($duration.TotalSeconds) segundos"
    
    # Mostrar estadísticas
    Show-Statistics -Host $Host -Port $Port -Username $Username -Password $Password -Database $DatabaseName
    
    # Verificar integridad
    Check-Integrity -Host $Host -Port $Port -Username $Username -Password $Password -Database $DatabaseName
    
    Write-Header "¡SEEDING COMPLETADO EXITOSAMENTE!"
} else {
    Write-Error-Custom "El seeding falló. Revisa los errores anteriores."
    exit 1
}

# Limpiar variable de contraseña
$env:PGPASSWORD = ""
