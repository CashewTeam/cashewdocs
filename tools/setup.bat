@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "PROJECT_DIR=%%~fI"
set "RUBY_BIN="

call :detect_ruby
if errorlevel 1 exit /b 1

set "BUNDLE_USER_HOME=%PROJECT_DIR%\.bundle-user"
set "BUNDLE_PATH=%PROJECT_DIR%\.bundle"
set "BUNDLE_APP_CONFIG=%PROJECT_DIR%\.bundle-config"
set "BUNDLE_SYSTEM_BINDIR="

cd /d "%PROJECT_DIR%"

if not exist "Gemfile" (
  echo Gemfile not found in "%PROJECT_DIR%".
  exit /b 1
)

echo.
echo ^> Using Ruby: "%RUBY_BIN%\ruby.exe"
call "%RUBY_BIN%\ruby.exe" -v

echo.
echo ^> Enabling RubyInstaller DevKit
call "%RUBY_BIN%\ridk.cmd" enable >nul

echo.
echo ^> Configuring Bundler local path
call "%RUBY_BIN%\bundle.bat" config set --local path ".bundle"
call "%RUBY_BIN%\bundle.bat" config set --local without "test"

if errorlevel 1 exit /b %ERRORLEVEL%

echo.
echo ^> Installing gems
call "%RUBY_BIN%\bundle.bat" install

if errorlevel 1 (
  echo.
  echo Bundle install failed.
  echo If the error mentions rubygems.org connection or permissions, rerun this file in your own terminal with normal network access.
  exit /b %ERRORLEVEL%
)

echo.
echo Setup complete.
echo Start local preview with:
echo   tools\run.bat
exit /b 0

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
echo Please install Ruby or edit tools\setup.bat to point to your Ruby bin directory.
exit /b 1

:ruby_found
exit /b 0
