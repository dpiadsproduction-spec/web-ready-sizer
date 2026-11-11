@echo off
setlocal enabledelayedexpansion

REM ==========================================================================
REM Web-Ready Sizer - Windows uninstaller
REM ==========================================================================

set "EXT_DIR=%APPDATA%\Adobe\CEP\extensions\com.webready.sizer"

if not exist "%EXT_DIR%" (
    echo Web-Ready Sizer is not installed at:
    echo   %EXT_DIR%
    exit /b 0
)

echo Remove %EXT_DIR% ?
choice /C YN /M "Continue"
if errorlevel 2 exit /b 0

rmdir /S /Q "%EXT_DIR%"
echo Removed. Restart Illustrator to complete the uninstall.
pause
