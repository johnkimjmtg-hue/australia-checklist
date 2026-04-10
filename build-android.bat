@echo off
echo.
echo ================================
echo   Android Build Start
echo ================================
echo.

set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%in;%PATH%

echo [1/2] React build...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Capacitor sync...
call npx cap sync android
if %errorlevel% neq 0 (
    echo Sync failed!
    pause
    exit /b 1
)

echo.
echo ================================
echo   Done! Now build AAB in Android Studio.
echo   Build - Generate Signed Bundle / APK
echo ================================
pause
