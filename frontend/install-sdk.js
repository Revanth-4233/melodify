import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function getJars(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJars(full));
    } else if (file.endsWith('.jar')) {
      results.push(full);
    }
  });
  return results;
}

const libDir = 'd:/Projects/My own spotify/frontend/android/sdk/cmdline-tools/latest/lib';
const cp = getJars(libDir).join(';');
const java = '"C:\\Program Files\\Java\\jdk-21\\bin\\java.exe"';
const sdkRoot = '"d:\\Projects\\My own spotify\\frontend\\android\\sdk"';
const toolsDir = '"d:\\Projects\\My own spotify\\frontend\\android\\sdk\\cmdline-tools\\latest"';

console.log("🚀 Accepting Android SDK Licenses & Installing Platforms...");
try {
  const yBuffer = Buffer.from('y\ny\ny\ny\ny\ny\ny\ny\ny\ny\n');
  const acceptCmd = `${java} "-Dcom.android.sdklib.toolsdir=${toolsDir}" -classpath "${cp}" com.android.sdklib.tool.sdkmanager.SdkManagerCli --sdk_root=${sdkRoot} --licenses`;
  try {
    execSync(acceptCmd, { input: yBuffer, stdio: ['pipe', 'inherit', 'inherit'], env: { ...process.env, JAVA_HOME: 'C:\\Program Files\\Java\\jdk-21' } });
  } catch (e) {
    console.log("License prompt finished.");
  }
  
  const installCmd = `${java} "-Dcom.android.sdklib.toolsdir=${toolsDir}" -classpath "${cp}" com.android.sdklib.tool.sdkmanager.SdkManagerCli --sdk_root=${sdkRoot} "platform-tools" "platforms;android-34" "platforms;android-36" "build-tools;35.0.0" "build-tools;34.0.0"`;
  execSync(installCmd, { stdio: 'inherit', env: { ...process.env, JAVA_HOME: 'C:\\Program Files\\Java\\jdk-21' } });

  console.log("✅ All Android SDK licenses accepted and components installed!");
} catch (e) {
  console.error("SDK manager error:", e.message);
}
