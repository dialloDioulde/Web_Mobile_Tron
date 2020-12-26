@Echo Off

REM check that conda is installed
WHERE conda >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    ECHO conda not found, please install miniconda
    exit /B -1
)

REM check that android studio was downloaded
set AndroidStudioArchive=android-studio-ide-201.6858069-windows.zip
IF NOT EXIST %AndroidStudioArchive% (
    ECHO "Android studio archive not found (%AndroidStudioArchive%), please download it"
    exit /B -1
)

REM check that gradle was downloaded
set GradleArchive=gradle-6.6.1-bin.zip
IF NOT EXIST %GradleArchive% (
    ECHO "Gradle archive not found (%GradleArchive%), please download it"
    exit /B -1
)

REM Create conda environment with nodejs, mongodb, java, unzip
set CondEnvName=DevWeb
call conda create -y -n %CondEnvName% nodejs mongodb openjdk=8.0.152 m2-unzip

REM Activate conda environment
call conda activate %CondEnvName%

REM Install cordova
call npm install -g cordova

REM Create Working folders
set WorkingFolder=DevWebDir
IF NOT EXIST %WorkingFolder% (
    mkdir %WorkingFolder%
)

IF NOT EXIST %WorkingFolder%\Sdk (
    mkdir %WorkingFolder%\Sdk
)

REM Unzip android-studio
IF NOT EXIST %WorkingFolder%\android-studio (
    cd %WorkingFolder%
    call unzip ..\%AndroidStudioArchive%
    cd ..
)

REM Unzip gradle
IF NOT EXIST %WorkingFolder%\gradle-6.6.1 (
    cd %WorkingFolder%
    call unzip ..\%GradleArchive%
    cd ..
)

REM Create cordova environment launch file
IF EXIST "LaunchCordova.bat" (
    del LaunchCordova.bat
)
ECHO set ANDROID_SDK_ROOT=%CD%\%WorkingFolder%\Sdk >> LaunchCordova.bat
set ANDROID_SDK_ROOT=%CD%\%WorkingFolder%\Sdk
ECHO set PATH=%ANDROID_SDK_ROOT%\tools;%ANDROID_SDK_ROOT\%platform-tools;%ANDROID_SDK_ROOT%\build-tools;%WorkingFolder%\gradle-6.6.1\bin;%CD%\%WorkingFolder%\android-studio\bin\;%%PATH%% >> LaunchCordova.bat
ECHO call conda activate %CondEnvName% >> LaunchCordova.bat

REM Deactivate conda env
call conda deactivate
