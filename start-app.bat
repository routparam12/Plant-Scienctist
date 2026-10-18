@echo off
echo ============================================
echo   Plant Scientist - Dev Startup Script
echo ============================================
echo.

:: Step 1: Check ADB connection
echo [1/3] Checking ADB device connection...
adb devices | findstr /R "device$" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] No Android device found! Make sure USB debugging is enabled.
    echo        Continuing anyway...
) else (
    echo [OK] Android device detected.
)

:: Step 2: Set up ADB reverse ports
echo.
echo [2/3] Setting up ADB reverse port forwarding...
adb reverse tcp:8000 tcp:8000
if %ERRORLEVEL% EQU 0 (
    echo [OK] Port 8000 forwarded (Backend API)
) else (
    echo [WARN] Failed to forward port 8000
)

adb reverse tcp:8081 tcp:8081
if %ERRORLEVEL% EQU 0 (
    echo [OK] Port 8081 forwarded (Metro Bundler)
) else (
    echo [WARN] Failed to forward port 8081
)

:: Step 3: Show reverse list
echo.
echo Active ADB reverse ports:
adb reverse --list
echo.

:: Step 4: Ensure Backend Server is running
echo [3/4] Checking Backend API Server...
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Backend not running on port 8000. Starting Backend in a separate window...
    start "Plant Scientist Backend" cmd /c "%~dp0start-backend.bat"
) else (
    echo [OK] Backend API is already active on port 8000.
)

:: Step 5: Start Expo
echo.
echo [4/4] Starting Expo Development Server...
echo ============================================
cd /d "%~dp0mobile-app"
npx expo start

pause
