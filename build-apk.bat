@echo off
title Plant Scientist - Android APK Builder
echo ===================================================
echo     Plant Scientist - Building Standalone APK
echo ===================================================
echo.
echo [1/3] Navigating to android directory...
cd /d "%~dp0mobile-app\android"

if not exist "%JAVA_HOME%\bin\java.exe" (
    if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
    ) else if exist "%USERPROFILE%\.jdks\jbr-21.0.11\bin\java.exe" (
        set "JAVA_HOME=%USERPROFILE%\.jdks\jbr-21.0.11"
    )
)

echo [2/3] Building Debug APK with Gradle...
call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo [SUCCESS] APK built successfully!
    echo ===================================================
    echo Location: "%~dp0mobile-app\android\app\build\outputs\apk\debug\app-debug.apk"
    echo.
    echo Opening output folder...
    explorer "%~dp0mobile-app\android\app\build\outputs\apk\debug"
) else (
    echo.
    echo [ERROR] Build failed. Please check the error output above.
)

pause



