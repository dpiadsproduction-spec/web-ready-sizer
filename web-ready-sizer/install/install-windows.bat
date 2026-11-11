@echo off
setlocal enabledelayedexpansion

REM ==========================================================================
REM Web-Ready Sizer - Windows installer
REM Copies the extension into the per-user CEP extensions folder and enables
REM PlayerDebugMode for CSXS 9/10/11 (Illustrator 2020-2023).
REM ==========================================================================

echo.
echo  Web-Ready Sizer - installer (Windows)
echo  =====================================
echo.

set "SRC=%~dp0.."
set "EXT_DIR=%APPDATA%\Adobe\CEP\extensions\com.webready.sizer"

if not exist "%SRC%\CSXS\manifest.xml" (
    echo [ERROR] manifest.xml not found. Run this script from the install folder
    echo         inside the extension package.
    pause
    exit /b 1
)

echo Extension source : %SRC%
echo Install target   : %EXT_DIR%
echo.

if exist "%EXT_DIR%" (
    echo [WARN] An existing installation was found. It will be replaced.
    choice /C YN /M "Continue"
    if errorlevel 2 exit /b 1
    rmdir /S /Q "%EXT_DIR%"
)

echo [1/4] Creating extensions folder...
if not exist "%APPDATA%\Adobe\CEP\extensions" (
    mkdir "%APPDATA%\Adobe\CEP\extensions"
)

echo [2/4] Copying extension files...
mkdir "%EXT_DIR%"
xcopy "%SRC%\CSXS" "%EXT_DIR%\CSXS" /E /I /Y >NUL
xcopy "%SRC%\client" "%EXT_DIR%\client" /E /I /Y >NUL
xcopy "%SRC%\jsx" "%EXT_DIR%\jsx" /E /I /Y >NUL
if exist "%SRC%\locale" xcopy "%SRC%\locale" "%EXT_DIR%\locale" /E /I /Y >NUL
if exist "%SRC%\resources" xcopy "%SRC%\resources" "%EXT_DIR%\resources" /E /I /Y >NUL
if exist "%SRC%\.debug" copy /Y "%SRC%\.debug" "%EXT_DIR%\.debug" >NUL

echo [3/4] Enabling PlayerDebugMode for CSXS 9, 10 and 11...
for %%V in (9 10 11) do (
    reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >NUL
)

echo [4/4] Verifying installation...
if exist "%EXT_DIR%\CSXS\manifest.xml" (
    echo       manifest.xml present
) else (
    echo [ERROR] Installation failed - manifest.xml missing.
    pause
    exit /b 1
)

echo.
echo  Done.
echo.
echo  Next steps:
echo    1. Fully quit and restart Adobe Illustrator.
echo    2. Open  Window ^> Extensions ^> Web-Ready Sizer
echo       (on Illustrator 2020 it may appear under Window ^> Extensions (Legacy)).
echo.
echo  If the panel does not appear, run this script again and make sure
echo  Illustrator is closed while installing.
echo.
pause
