@echo off
echo 🔄 Sincronizando com GitHub...
echo.

cd /d "%~dp0"

REM Verificar se há alterações
"C:\Program Files\Git\bin\git.exe" status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo ✅ Nenhuma alteração para sincronizar.
    goto :end
)

REM Adicionar arquivos
echo 📝 Adicionando arquivos alterados...
"C:\Program Files\Git\bin\git.exe" add .

REM Fazer commit
echo 💾 Fazendo commit...
"C:\Program Files\Git\bin\git.exe" commit -m "🔄 Auto-sync: Update project files (%date% %time%)"

REM Fazer push
echo 🚀 Enviando para GitHub...
"C:\Program Files\Git\bin\git.exe" push origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ Sincronização concluída com sucesso!
) else (
    echo.
    echo ❌ Erro na sincronização. Verifique sua conexão.
)

:end
echo.
pause
