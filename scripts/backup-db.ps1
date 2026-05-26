$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "C:\backups\heng_yun"
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir }

$dbName = "quarry_system"
$dbUser = "postgres"
$dbHost = "localhost"
$backupFile = "$backupDir\heng_yun_$date.sql"

# Use pg_dump (adjust path to your PostgreSQL bin folder)
$pgDump = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
& $pgDump -U $dbUser -h $dbHost -d $dbName --no-owner --no-privileges > $backupFile

# Keep only last 30 backups
Get-ChildItem -Path $backupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30 | Remove-Item

Write-Host "Backup created: $backupFile"