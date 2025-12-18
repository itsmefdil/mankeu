# Android Build Guide (Linux/CLI)

This guide explains how to build the Android APK for the generic generic Mankeu project using the Command Line Interface (CLI), without needing the full Android Studio GUI.

## 1. Prerequisites

### Install Java (OpenJDK 21)
The project requires Java 21.
```bash
sudo apt-get update
sudo apt-get install -y openjdk-21-jdk
```

**Verify installation:**
```bash
java -version
```

### Set JAVA_HOME
Ensure `JAVA_HOME` is set. You can add this to your `.bashrc` or `.zshrc`:
```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
```

## 2. Android SDK Setup

You don't need the full Android Studio. You only need the **Command Line Tools**.

### Download & Install SDK
Run these commands from the project root:

1.  **Create directory:**
    ```bash
    mkdir -p tools/android-sdk
    ```

2.  **Download Command Line Tools:**
    ```bash
    wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O tools/cmdline-tools.zip
    ```

3.  **Extract and restructure (Critical Step):**
    Android requires a specific folder structure (`cmdline-tools/latest/bin`).
    ```bash
    unzip tools/cmdline-tools.zip -d tools/android-sdk/
    mkdir -p tools/android-sdk/cmdline-tools/latest
    mv tools/android-sdk/cmdline-tools/* tools/android-sdk/cmdline-tools/latest/ 2>/dev/null || true
    # Clean up accidental nesting if it happened
    if [ -d "tools/android-sdk/cmdline-tools/latest/cmdline-tools" ]; then 
        mv tools/android-sdk/cmdline-tools/latest/cmdline-tools/* tools/android-sdk/cmdline-tools/latest/
        rmdir tools/android-sdk/cmdline-tools/latest/cmdline-tools
    fi
    ```

4.  **Accept Licenses:**
    ```bash
    yes | tools/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses --sdk_root=$(pwd)/tools/android-sdk
    ```

### Configure Project
Tell the Android project where the SDK is located.

Create `frontend/android/local.properties`:
```bash
echo "sdk.dir=$(pwd)/tools/android-sdk" > frontend/android/local.properties
```

## 3. Build the APK

### Sync Frontend Changes
Whenever you update the web code (`src/`), you must rebuild the web assets and sync them to the Android project.

```bash
# In the frontend directory (or use npm run android:sync from root if configured)
cd frontend
npm run android:sync
```

### Build Debug APK
```bash
cd android
./gradlew assembleDebug
```

### Locate APK
If successful, the APK is located at:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## Common Issues

*   **"Missing classes" or "Duplicate class" errors**: This usually happens due to conflicting Kotlin versions. We have added a resolution strategy in `build.gradle` to force Kotlin 1.9.10.
*   **"JAVA_HOME is not set"**: Make sure you exported the variable as shown in step 1.
*   **"SDK location not found"**: Check `frontend/android/local.properties` and ensure `sdk.dir` points to a valid absolute path.
