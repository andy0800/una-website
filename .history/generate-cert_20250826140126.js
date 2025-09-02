const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

// Generate a new key pair
const keys = forge.pki.rsa.generateKeyPair(2048);

// Create a new certificate
const cert = forge.pki.createCertificate();

// Set the public key
cert.publicKey = keys.publicKey;

// Set the serial number
cert.serialNumber = '01';

// Set the validity period
const now = new Date();
cert.validity.notBefore = now;
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(now.getFullYear() + 1);

// Set the subject and issuer
const attrs = [
  { name: 'commonName', value: '192.168.8.137' },
  { name: 'countryName', value: 'US' },
  { name: 'stateOrProvinceName', value: 'State' },
  { name: 'localityName', value: 'City' },
  { name: 'organizationName', value: 'UNA Institute' },
  { name: 'organizationalUnitName', value: 'Development' }
];

cert.setSubject(attrs);
cert.setIssuer(attrs);

// Set the extensions
cert.setExtensions([
  {
    name: 'basicConstraints',
    cA: true
  },
  {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  },
  {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true
  },
  {
    name: 'subjectAltName',
    altNames: [
      {
        type: 2, // DNS
        value: 'localhost'
      },
      {
        type: 7, // IP
        ip: '192.168.8.137'
      },
      {
        type: 7, // IP
        ip: '127.0.0.1'
      }
    ]
  }
]);

// Sign the certificate
cert.sign(keys.privateKey);

// Convert to PEM format
const certPem = forge.pki.certificateToPem(cert);
const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

// Ensure certs directory exists
const certsDir = path.join(__dirname, 'frontend', 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Write the certificate and key
fs.writeFileSync(path.join(certsDir, 'cert.pem'), certPem);
fs.writeFileSync(path.join(certsDir, 'key.pem'), keyPem);

console.log('✅ Self-signed certificate generated successfully!');
console.log('📁 Certificate: frontend/certs/cert.pem');
console.log('🔑 Private Key: frontend/certs/key.pem');
console.log('🌐 Now you can access: https://192.168.8.137:3000');
