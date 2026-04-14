@echo off
echo ========================================
echo GitHub Push Script
echo ========================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [1/6] Initializing git repository...
git init

echo.
echo [2/6] Adding all files...
git add .

echo.
echo [3/6] Creating initial commit...
git commit -m "Initial commit: GitHub webhook handler for Vercel"

echo.
echo [4/6] Adding remote repository...
git remote add origin https://github.com/nokosite/bot-discord-convert.git

echo.
echo [5/6] Setting branch to main...
git branch -M main

echo.
echo [6/6] Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo SUCCESS! Project pushed to GitHub
echo ========================================
echo.
echo Next steps:
echo 1. Go to https://vercel.com
echo 2. Import repository: nokosite/bot-discord-convert
echo 3. Add environment variables (Discord webhooks)
echo 4. Deploy!
echo.
pause
