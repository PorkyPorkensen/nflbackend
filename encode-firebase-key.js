#!/usr/bin/env node

/**
 * Helper script to base64-encode your Firebase private key for use in Elastic Beanstalk
 * Usage: node encode-firebase-key.js
 * 
 * This will read FIREBASE_PRIVATE_KEY from environment or stdin,
 * then output the base64-encoded version to set as FIREBASE_PRIVATE_KEY_B64
 */

const fs = require('fs');

let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!privateKey) {
  console.error('Error: FIREBASE_PRIVATE_KEY environment variable not set');
  console.error('');
  console.error('Usage:');
  console.error('  1. Export your private key:');
  console.error('     export FIREBASE_PRIVATE_KEY="$(cat /path/to/key.json | jq -r .private_key)"');
  console.error('  2. Run this script:');
  console.error('     node encode-firebase-key.js');
  console.error('  3. Copy the output and set it as FIREBASE_PRIVATE_KEY_B64 in EB');
  process.exit(1);
}

// Base64 encode the private key
const encoded = Buffer.from(privateKey, 'utf8').toString('base64');

console.log('\n✅ Firebase Private Key Base64 Encoded\n');
console.log('Set this as FIREBASE_PRIVATE_KEY_B64 in your Elastic Beanstalk environment:');
console.log('');
console.log(encoded);
console.log('');
console.log('Then remove or clear FIREBASE_PRIVATE_KEY from EB environment variables.');
console.log('The backend will automatically use the base64 version if present.\n');
