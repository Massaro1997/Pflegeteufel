@echo off
REM ============================================
REM Voice Mode Launcher for Claude Code
REM Starts both Voice Listener and Bridge
REM ============================================

title Claude Code - Voice Mode Launcher

echo.
echo ================================================
echo   🎤 AVVIO VOICE MODE PER CLAUDE CODE
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRORE: Python non trovato!
    echo.
    echo    Installa Python da: https://python.org
    echo.
    pause
    exit /b 1
)

REM Check if voice-listener.ps1 exists
if not exist "voice-listener.ps1" (
    echo ❌ ERRORE: voice-listener.ps1 non trovato!
    echo.
    echo    Assicurati di essere nella directory corretta.
    echo.
    pause
    exit /b 1
)

REM Check if voice-bridge.py exists
if not exist "voice-bridge.py" (
    echo ❌ ERRORE: voice-bridge.py non trovato!
    echo.
    pause
    exit /b 1
)

echo ✅ Python trovato
echo ✅ Scripts trovati
echo.

echo 📋 Controllo dipendenze Python...
echo.

REM Install Python dependencies if needed
pip show pywin32 >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Installazione pywin32...
    pip install pywin32 >nul 2>&1
    if errorlevel 1 (
        echo ❌ Errore installazione pywin32
        pause
        exit /b 1
    )
    echo ✅ pywin32 installato
)

echo.
echo ================================================
echo   🚀 AVVIO COMPONENTI
echo ================================================
echo.

REM Start Voice Bridge (Python) in a new window
echo 🌉 Avvio Voice Bridge (Python)...
start "Voice Bridge - Claude Code" cmd /k "python voice-bridge.py"
timeout /t 2 >nul

echo 🎙️  Avvio Voice Listener (PowerShell)...
echo.
echo ================================================
echo   ✅ SISTEMA VOICE MODE ATTIVO!
echo ================================================
echo.
echo 📌 FINESTRE APERTE:
echo    1. Voice Bridge (Python) - Monitora input
echo    2. Voice Listener (PowerShell) - Cattura voce
echo    3. Questa finestra (Launcher)
echo.
echo 🎯 ISTRUZIONI:
echo    • Tieni premuto F12 per parlare
echo    • Rilascia F12 quando hai finito
echo    • Il testo viene copiato automaticamente
echo    • Incolla con CTRL+V in Claude Code
echo.
echo 🔴 Per uscire: Chiudi tutte le finestre o CTRL+C
echo.
echo ================================================
echo.

REM Start PowerShell Voice Listener (in this window)
powershell.exe -ExecutionPolicy Bypass -File "voice-listener.ps1"

REM If we reach here, voice listener was closed
echo.
echo 🛑 Voice Listener terminato
echo.
pause
