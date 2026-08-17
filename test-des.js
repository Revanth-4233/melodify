// Test DES-ECB decryption in pure JS (no crypto module)
const encryptedUrl = 'ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyFBv88/S8Lvw2q8woEGOzs4+i/dBJ17IOfkMl9+m6h4Re4/g5WJSTjhw7tS9a8Gtq';
const KEY = '38346591';

// Standard DES tables
const PC1 = [
  57,49,41,33,25,17, 9, 1,58,50,42,34,26,18,
  10, 2,59,51,43,35,27,19,11, 3,60,52,44,36,
  63,55,47,39,31,23,15, 7,62,54,46,38,30,22,
  14, 6,61,53,45,37,29,21,13, 5,28,20,12, 4
];

const PC2 = [
  14,17,11,24, 1, 5, 3,28,15, 6,21,10,
  23,19,12, 4,26, 8,16, 7,27,20,13, 2,
  41,52,31,37,47,55,30,40,51,45,33,48,
  44,49,39,56,34,53,46,42,50,36,29,32
];

const IP_TABLE = [
  58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,
  62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,
  57,49,41,33,25,17, 9,1,59,51,43,35,27,19,11,3,
  61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7
];

const FP_TABLE = [
  40, 8,48,16,56,24,64,32,39, 7,47,15,55,23,63,31,
  38, 6,46,14,54,22,62,30,37, 5,45,13,53,21,61,29,
  36, 4,44,12,52,20,60,28,35, 3,43,11,51,19,59,27,
  34, 2,42,10,50,18,58,26,33, 1,41, 9,49,17,57,25
];

const E_TABLE = [
  32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9,
   8, 9,10,11,12,13,12,13,14,15,16,17,
  16,17,18,19,20,21,20,21,22,23,24,25,
  24,25,26,27,28,29,28,29,30,31,32, 1
];

const P_TABLE = [
  16, 7,20,21,29,12,28,17, 1,15,23,26,
   5,18,31,10, 2, 8,24,14,32,27, 3, 9,
  19,13,30, 6,22,11, 4,25
];

const SBOXES = [
  // S1
  [
    [14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7],
    [0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8],
    [4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0],
    [15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13]
  ],
  // S2
  [
    [15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10],
    [3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5],
    [0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15],
    [13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9]
  ],
  // S3
  [
    [10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8],
    [13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1],
    [13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7],
    [1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12]
  ],
  // S4
  [
    [7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15],
    [13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9],
    [10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4],
    [3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14]
  ],
  // S5
  [
    [2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9],
    [14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6],
    [4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14],
    [11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3]
  ],
  // S6
  [
    [12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11],
    [10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8],
    [9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6],
    [4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13]
  ],
  // S7
  [
    [4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1],
    [13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6],
    [1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2],
    [6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12]
  ],
  // S8
  [
    [13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7],
    [1,15,13,8,10,3,7,4,12,5,6,2,0,14,9,11],
    [7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8],
    [2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]
  ]
];

const SHIFTS = [1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1];

// Convert byte array to 64-bit representation (array of 0s and 1s)
function bytesToBits(bytes) {
  const bits = [];
  for (let i = 0; i < bytes.length; i++) {
    for (let j = 7; j >= 0; j--) {
      bits.push((bytes[i] >> j) & 1);
    }
  }
  return bits;
}

function bitsToBytes(bits) {
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (bits[i + j] || 0);
    }
    bytes.push(byte);
  }
  return bytes;
}

function permute(input, table) {
  return table.map(pos => input[pos - 1]);
}

function xorBits(a, b) {
  return a.map((val, i) => val ^ b[i]);
}

function rotateLeft(arr, count) {
  return [...arr.slice(count), ...arr.slice(0, count)];
}

// Generate 16 subkeys
function generateSubkeys(keyBytes) {
  const keyBits = bytesToBits(keyBytes);
  const permutedKey = permute(keyBits, PC1);
  let C = permutedKey.slice(0, 28);
  let D = permutedKey.slice(28);
  
  const subkeys = [];
  for (let i = 0; i < 16; i++) {
    C = rotateLeft(C, SHIFTS[i]);
    D = rotateLeft(D, SHIFTS[i]);
    const combined = [...C, ...D];
    subkeys.push(permute(combined, PC2));
  }
  return subkeys;
}

// Feistel function
function feistel(R, subkey) {
  const expanded = permute(R, E_TABLE);
  const xored = xorBits(expanded, subkey);
  
  // S-box substitution
  const sboxOutput = [];
  for (let i = 0; i < 8; i++) {
    const chunk = xored.slice(i * 6, i * 6 + 6);
    const row = (chunk[0] << 1) | chunk[5];
    const col = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];
    const val = SBOXES[i][row][col];
    sboxOutput.push((val >> 3) & 1, (val >> 2) & 1, (val >> 1) & 1, val & 1);
  }
  
  return permute(sboxOutput, P_TABLE);
}

// Decrypt a single 8-byte block
function desDecryptBlock(blockBytes, subkeys) {
  const bits = permute(bytesToBits(blockBytes), IP_TABLE);
  let L = bits.slice(0, 32);
  let R = bits.slice(32);
  
  // Decryption: apply subkeys in reverse order (15 down to 0)
  for (let i = 15; i >= 0; i--) {
    const f = feistel(R, subkeys[i]);
    const newR = xorBits(L, f);
    L = R;
    R = newR;
  }
  
  // Combine R + L (swapped) and apply final permutation
  const combined = [...R, ...L];
  const result = permute(combined, FP_TABLE);
  return bitsToBytes(result);
}

// Main decryption
const keyBytes = Array.from(KEY).map(c => c.charCodeAt(0));
const subkeys = generateSubkeys(keyBytes);

const encBytes = Buffer.from(encryptedUrl, 'base64');
const decryptedBytes = [];

for (let i = 0; i < encBytes.length; i += 8) {
  const block = Array.from(encBytes.slice(i, i + 8));
  decryptedBytes.push(...desDecryptBlock(block, subkeys));
}

// Remove PKCS5 padding
const padLen = decryptedBytes[decryptedBytes.length - 1];
const unpadded = decryptedBytes.slice(0, decryptedBytes.length - padLen);
const url = String.fromCharCode(...unpadded);

console.log('Decrypted:', url);
console.log('320kbps:', url.replace(/_96\.mp4/g, '_320.mp4').replace(/_160\.mp4/g, '_320.mp4'));
