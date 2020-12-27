# check that conda is installed
if ! command -v conda &> /dev/null
then
    echo "conda not found, please install miniconda"
    exit
fi

# check that android studio was downloaded
export AndroidSDKArchive=android-studio-ide-201.6858069-linux.tar.gz
if [ ! -f "$AndroidSDKArchive" ]
then
	echo "android-studio archive not found ($AndroidSDKArchive), please download it"
	exit
fi

# Create conda environment with nodejs, mongodb, java, gradle
export CondEnvName=DevWeb
conda create -y -n $CondEnvName nodejs mongodb openjdk=8.0.152 gradle

# activate conda environment
source $CONDA_PREFIX/etc/profile.d/conda.sh
conda activate $CondEnvName

# Install cordova
npm install -g cordova

# Create Working folders
export WorkingFolder=DevWebDir
if [ ! -d "$WorkingFolder" ]
then
    mkdir $WorkingFolder
fi

if [ ! -d "$WorkingFolder/Sdk" ]
then
    mkdir $WorkingFolder/Sdk
fi

# Unzip android-studio
if [ ! -d "$WorkingFolder/android-studio" ]
then
	cd $WorkingFolder
	tar xvfz ../$AndroidSDKArchive
	cd ..
fi

# Create cordova environment launch file
if [ -f "LaunchCordova.sh" ]
then
    rm LaunchCordova.sh
fi

# get current DIR
CWD=$(pwd)

echo export ANDROID_SDK_ROOT=$CWD/$WorkingFolder/Sdk >> LaunchCordova.sh
export ANDROID_SDK_ROOT=$CWD/$WorkingFolder/Sdk
echo export PATH=$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/build-tools:$CWD/$WorkingFolder/android-studio/bin/:\$PATH >> LaunchCordova.sh
echo source \$CONDA_PREFIX/etc/profile.d/conda.sh >> LaunchCordova.sh
echo conda activate $CondEnvName >> LaunchCordova.sh
chmod +x LaunchCordova.sh
