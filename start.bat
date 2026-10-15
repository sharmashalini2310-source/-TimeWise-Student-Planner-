@echo off
title TimeWise Student Planner
cd /d "%~dp0"
echo ======================================
echo          TimeWise Student Planner
echo ======================================
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Created .env from .env.example.
  echo Please check MONGO_URI and JWT_SECRET in .env before continuing.
)
if not exist "node_modules" (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection and Node.js installation.
    pause
    exit /b 1
  )
)
echo Starting TimeWise...
call npm run dev
pause
