@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "PROJECT_DIR=%%~fI"

set "HOST=127.0.0.1"
set "JEKYLL_ENV_VALUE="
set "RUBY_BIN="

call :detect_ruby
if errorlevel 1 exit /b 1

set "BUNDLE_USER_HOME=%PROJECT_DIR%\.bundle-user"
set "BUNDLE_PATH=%PROJECT_DIR%\.bundle"
set "BUNDLE_APP_CONFIG=%PROJECT_DIR%\.bundle-config"

:parse_args
if "%~1"=="" goto run
if /I "%~1"=="-H" goto set_host
if /I "%~1"=="--host" goto set_host
if /I "%~1"=="-p" goto set_prod
if /I "%~1"=="--production" goto set_prod
if /I "%~1"=="-h" goto help
if /I "%~1"=="--help" goto help

echo Unknown option: %~1
echo.
goto help

:set_host
if "%~2"=="" (
  echo Missing host value after %~1
  echo.
  goto help
)
set "HOST=%~2"
shift
shift
goto parse_args

:set_prod
set "JEKYLL_ENV_VALUE=production"
shift
goto parse_args

:help
echo Usage:
echo.
echo   run.bat [options]
echo.
echo Options:
echo   -H, --host [HOST]    Host to bind to. Default: 127.0.0.1
echo   -p, --production     Run Jekyll in production mode.
echo   -h, --help           Print this help information.
exit /b 0

:run
cd /d "%PROJECT_DIR%"

if not exist "Gemfile" (
  echo Gemfile not found in "%PROJECT_DIR%".
  exit /b 1
)

if not exist "%RUBY_BIN%\bundle.bat" (
  echo bundle.bat not found in "%RUBY_BIN%".
  exit /b 1
)

set "BUNDLE_SYSTEM_BINDIR="
call "%RUBY_BIN%\ridk.cmd" enable >nul

if defined JEKYLL_ENV_VALUE (
  set "JEKYLL_ENV=%JEKYLL_ENV_VALUE%"
  echo.
  echo ^> "%RUBY_BIN%\bundle.bat" exec jekyll s -l -H %HOST%
  echo.
  call "%RUBY_BIN%\bundle.bat" exec jekyll s -l -H %HOST%
) else (
  echo.
  echo ^> "%RUBY_BIN%\bundle.bat" exec jekyll s -l -H %HOST%
  echo.
  call "%RUBY_BIN%\bundle.bat" exec jekyll s -l -H %HOST%
)

set "RUN_EXIT_CODE=%ERRORLEVEL%"
echo.
echo Jekyll exited with code %RUN_EXIT_CODE%.
pause
exit /b %RUN_EXIT_CODE%

:detect_ruby
for %%D in (
  "C:\tools\ruby34\bin"
  "C:\tools\ruby33\bin"
  "C:\Ruby34-x64\bin"
  "C:\Ruby33-x64\bin"
  "C:\Users\Con11\Ruby\bin"
  "C:\Users\Con11\AppData\Local\Programs\Ruby\bin"
) do (
  if exist "%%~D\ruby.exe" (
    set "RUBY_BIN=%%~D"
    goto ruby_found
  )
)

echo Ruby not found.
echo Please install Ruby or edit tools\run.bat to point to your Ruby bin directory.
exit /b 1

:ruby_found
exit /b 0
