import { spawn } from 'child_process';
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
const java = 'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe';
const sdkRoot = 'd:\\Projects\\My own spotify\\frontend\\android\\sdk';
const toolsDir = 'd:\\Projects\\My own spotify\\frontend\\android\\sdk\\cmdline-tools\\latest';

console.log("🚀 Interactively accepting all Android SDK licenses...");

const child = spawn(java, [
  `-Dcom.android.sdklib.toolsdir=${toolsDir}`,
  '-classpath',
  cp,
  'com.android.sdklib.tool.sdkmanager.SdkManagerCli',
  `--sdk_root=${sdkRoot}`,
  '--licenses'
], {
  env: { ...process.env, JAVA_HOME: 'C:\\Program Files\\Java\\jdk-21' }
});

child.stdout.on('data', data => {
  const str = data.toString();
  console.log(str);
  child.stdin.write('y\n');
});

child.stderr.on('data', data => {
  console.error(data.toString());
});

child.on('close', code => {
  console.log(`✅ License manager finished with code ${code}`);
});
