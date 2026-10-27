@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 22 LTS or later from https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules\next" (
  echo Installing dependencies. Internet is required for the first run...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check internet connection and try again.
    pause
    exit /b 1
  )
)
echo Starting CertAlign. Open http://localhost:3000 in your browser.
call npm run dev
pause
