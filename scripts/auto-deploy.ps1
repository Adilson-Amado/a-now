$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repoRoot
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$excluded = @(
  ".git\\",
  "node_modules\\",
  "dist\\",
  "dev-dist\\",
  ".vercel\\"
)

$debounceSeconds = 5
$lastEvent = Get-Date
$pending = $false

function Should-Ignore([string]$path) {
  foreach ($prefix in $excluded) {
    if ($path -like "*$prefix*") { return $true }
  }
  return $false
}

function Has-Changes {
  $status = git status --porcelain
  return [bool]$status
}

function Do-Deploy {
  if (-not (Has-Changes)) { return }

  git add -A
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  git commit -m "auto: $timestamp"
  git push
  Write-Host "Auto-deploy: push feito em $timestamp"
}

Register-ObjectEvent $watcher "Changed" -Action {
  if (Should-Ignore $Event.SourceEventArgs.FullPath) { return }
  $global:pending = $true
  $global:lastEvent = Get-Date
} | Out-Null

Register-ObjectEvent $watcher "Created" -Action {
  if (Should-Ignore $Event.SourceEventArgs.FullPath) { return }
  $global:pending = $true
  $global:lastEvent = Get-Date
} | Out-Null

Register-ObjectEvent $watcher "Deleted" -Action {
  if (Should-Ignore $Event.SourceEventArgs.FullPath) { return }
  $global:pending = $true
  $global:lastEvent = Get-Date
} | Out-Null

Register-ObjectEvent $watcher "Renamed" -Action {
  if (Should-Ignore $Event.SourceEventArgs.FullPath) { return }
  $global:pending = $true
  $global:lastEvent = Get-Date
} | Out-Null

Write-Host "Auto-deploy rodando. Pressione Ctrl+C para parar."

while ($true) {
  Start-Sleep -Seconds 1
  if ($pending -and ((Get-Date) - $lastEvent).TotalSeconds -ge $debounceSeconds) {
    $pending = $false
    try {
      Do-Deploy
    } catch {
      Write-Host "Falha no auto-deploy: $($_.Exception.Message)"
    }
  }
}
