import fs from 'fs';
import path from 'path';

const licDir = 'd:/Projects/My own spotify/frontend/android/sdk/licenses';
if (!fs.existsSync(licDir)) fs.mkdirSync(licDir, { recursive: true });

const mainLicense = [
  '893737245849f2351470f7480202919d37311178',
  '24333f8a637187a1516daf8b90131161000e1af9',
  '563754fa6efe9fe5030886c9f4f0ed020e3f8d83',
  '3b35787837986e382227d661f054a299899c808f',
  '7a9344918d5750000b673e4a29febba6a87756f7',
  'd56f5187479451eabf01fb78af6dfcb131a6481e',
  'e673f08d471158a18357a7ce805041a6b0c29a8c',
  'ccb241361c47094b8e72fae7e6eb022f67ec4c6d'
].join('\n');

fs.writeFileSync(path.join(licDir, 'android-sdk-license'), mainLicense);
fs.writeFileSync(path.join(licDir, 'android-sdk-preview-license'), '84831b9409646a918e30573bab4c9c91346d8abd');
fs.writeFileSync(path.join(licDir, 'android-googletv-license'), '6010077e686726c67019473d9796ece0120f52a3');
fs.writeFileSync(path.join(licDir, 'android-sdk-arm-dbt-license'), '859f317696e3592786659ede64d8c6b014eff443');
fs.writeFileSync(path.join(licDir, 'google-gdk-license'), '33b622e747211667073d037e631637f30050d365');
fs.writeFileSync(path.join(licDir, 'intel-android-extra-license'), 'd975f751698789c6d9c444263b3545a301ea5670');
fs.writeFileSync(path.join(licDir, 'intel-android-sysimage-license'), 'd975f751698789c6d9c444263b3545a301ea5670');
fs.writeFileSync(path.join(licDir, 'mips-android-sysimage-license'), 'e9acab883015a0a9f8edde3a0cbfd773e2b2f53b');

console.log("Licenses written successfully!");
