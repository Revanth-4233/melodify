@echo off
set JAVA_HOME=C:\Program Files\Java\jdk-21
set SDK_ROOT=d:\Projects\My own spotify\frontend\android\sdk
(
  echo y
  echo y
  echo y
  echo y
  echo y
  echo y
  echo y
  echo y
) | "%SDK_ROOT%\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="%SDK_ROOT%" --licenses
