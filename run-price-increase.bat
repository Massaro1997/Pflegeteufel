@echo off
echo Recupero credenziali da Cloudflare Worker...

REM Esegui wrangler tail per ottenere le variabili (questo non funziona direttamente)
REM Invece usiamo il worker stesso per eseguire l'operazione

echo.
echo Esecuzione aumento prezzi tramite Cloudflare Worker...
echo.

curl -X POST https://shopify-backend.massarocalogero1997.workers.dev/api/admin/increase-prices ^
  -H "Content-Type: application/json" ^
  -H "X-Worker-Key: %WORKER_SHARED_KEY%" ^
  -d "{\"increase\": 1.00}"

echo.
echo Fatto!
pause
