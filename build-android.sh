# Set JAVA_HOME (Anda bisa menambahkannya ke .zshrc atau .bashrc agar permanen)
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

# Build
cd frontend
bun run android:sync      # Sync perubahan JS ke Android
cd android
./gradlew assembleDebug   # Build APK