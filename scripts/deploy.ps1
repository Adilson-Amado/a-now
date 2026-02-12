$ErrorActionPreference = "Stop"

function Ensure-CleanStage {
  $status = git status --porcelain
  if (-not $status) {
    Write-Host "Nenhuma alteracao para publicar."
    exit 0
  }
}

Ensure-CleanStage

git add -A
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "deploy: $timestamp"
git push

Write-Host "Push concluido. O Vercel vai iniciar o deploy automaticamente."
