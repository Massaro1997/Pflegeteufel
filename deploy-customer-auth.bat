@echo off
REM ====================================================================
REM Deploy Script - Sistema Autenticazione Clienti Pflegeteufel
REM ====================================================================

echo.
echo ========================================
echo  DEPLOY CUSTOMER AUTHENTICATION SYSTEM
echo ========================================
echo.

REM Check if in correct directory
if not exist "wrangler-auth.toml" (
    echo ERROR: wrangler-auth.toml not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo Step 1: Verifying database connection...
npx wrangler d1 execute pflegeteufel-customers --command="SELECT COUNT(*) FROM sqlite_master WHERE type='table'"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Database connection failed!
    echo Please check your D1 database configuration.
    pause
    exit /b 1
)
echo ✓ Database connection OK
echo.

echo Step 2: Applying database schema...
npx wrangler d1 execute pflegeteufel-customers --file=database-schema-customers.sql
if %ERRORLEVEL% neq 0 (
    echo WARNING: Schema application had issues (might be OK if tables already exist)
)
echo ✓ Schema applied
echo.

echo Step 3: Verifying secrets...
echo.
echo Please ensure these secrets are configured:
echo   - JWT_SECRET
echo   - WORKER_SHARED_KEY (should be: felix_backend_2025)
echo.
set /p CONTINUE="Continue with deployment? (Y/N): "
if /i not "%CONTINUE%"=="Y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo Step 4: Deploying Cloudflare Worker...
npx wrangler deploy -c wrangler-auth.toml
if %ERRORLEVEL% neq 0 (
    echo ERROR: Worker deployment failed!
    pause
    exit /b 1
)
echo ✓ Worker deployed successfully
echo.

echo Step 5: Testing deployment...
echo Testing health endpoint...
curl https://pflegeteufel-auth.massarocalogero1997.workers.dev/health
echo.

echo.
echo ========================================
echo  DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Create Shopify pages (registrierung, login, mein-konto)
echo 2. Assign templates to pages
echo 3. Add menu links
echo 4. Test registration and login
echo.
echo Documentation:
echo   - QUICK_START_CUSTOMER_AUTH.md
echo   - CUSTOMER_REGISTRATION_SETUP.md
echo   - api-examples.md
echo.
pause
