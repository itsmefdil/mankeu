#!/usr/bin/env bash
set -e

# Direktori root project
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set JAVA_HOME & ANDROID_HOME jika belum ada
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"
export ANDROID_HOME="${ANDROID_HOME:-/home/noma/Android/Sdk}"

echo "==> Building web assets & syncing with Capacitor..."
cd "$PROJECT_ROOT/frontend"
bun run android:sync

echo "==> Building Android APK with Gradle..."
cd "$PROJECT_ROOT/frontend/android"
./gradlew assembleDebug

# Pindahkan file APK ke root project
APK_SRC="$PROJECT_ROOT/frontend/android/app/build/outputs/apk/debug/app-debug.apk"
APK_DEST="$PROJECT_ROOT/app-debug.apk"

if [ -f "$APK_SRC" ]; then
  mv "$APK_SRC" "$APK_DEST"
  echo ""
  echo "✅ Build selesai! APK berhasil dipindahkan ke:"
  echo "   $APK_DEST"
  echo "   Ukuran: $(du -h "$APK_DEST" | cut -f1)"
else
  echo "❌ Error: File APK tidak ditemukan di $APK_SRC"
  exit 1
fi
