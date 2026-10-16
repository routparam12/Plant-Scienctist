@echo off
title Re-bind ADB Reverse Ports
echo Re-binding ADB reverse ports for Plant Scientist...
adb reverse tcp:8000 tcp:8000
adb reverse tcp:8081 tcp:8081
echo.
adb reverse --list
echo.
echo [DONE] Port 8000 (Backend) and Port 8081 (Expo) are connected to your phone!
timeout /t 3
