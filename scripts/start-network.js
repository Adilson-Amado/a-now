const { networkInterfaces } = require('os');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Obter todos os IPs da máquina
function getLocalIPs() {
  const nets = networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Ignorar endereços internos e não-IPv4
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          interface: name,
          ip: net.address,
          type: getNetworkType(net.address)
        });
      }
    }
  }
  
  return results;
}

function getNetworkType(ip) {
  if (ip.startsWith('192.168.')) return 'Local Network';
  if (ip.startsWith('10.')) return 'Private Network';
  if (ip.startsWith('172.')) return 'Private Network';
  if (ip.startsWith('169.254.')) return 'Link-local';
  return 'Unknown';
}

// Obter IP público (opcional)
function getPublicIP() {
  return new Promise((resolve) => {
    exec('curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "Unable to get public IP"', (error, stdout) => {
      if (error) {
        resolve(null);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Gerar QR code para acesso mobile
function generateQRCode(url) {
  try {
    const QRCode = require('qrcode');
    return QRCode.toString(url, { type: 'terminal', small: true });
  } catch (error) {
    return 'QR Code generation not available. Install qrcode package: npm install qrcode';
  }
}

async function main() {
  console.log('\n🌐 FOCUSFLOW - NETWORK ACCESS CONFIGURATION\n');
  console.log('=' .repeat(50));
  
  const ips = getLocalIPs();
  const port = 8080;
  
  if (ips.length === 0) {
    console.log('❌ No network interfaces found!');
    console.log('Make sure you are connected to a network.');
    return;
  }
  
  console.log('\n📱 ACCESS URLS:');
  console.log('-'.repeat(30));
  
  // Local access
  console.log(`\n🏠 Local Access:`);
  console.log(`   http://localhost:${port}`);
  console.log(`   http://127.0.0.1:${port}`);
  
  // Network access
  console.log(`\n🌍 Network Access:`);
  ips.forEach(({ interface: iface, ip, type }) => {
    const url = `http://${ip}:${port}`;
    console.log(`   ${url}`);
    console.log(`   └─ Interface: ${iface} (${type})`);
  });
  
  // Public IP (se disponível)
  const publicIP = await getPublicIP();
  if (publicIP) {
    console.log(`\n🌐 Public Access (if port forwarded):`);
    console.log(`   http://${publicIP}:${port}`);
  }
  
  // QR Code para o primeiro IP disponível
  if (ips.length > 0) {
    const primaryIP = ips[0].ip;
    const mobileURL = `http://${primaryIP}:${port}`;
    
    console.log(`\n📱 MOBILE ACCESS (QR Code):`);
    console.log(`   Scan this QR code with your phone:`);
    console.log(generateQRCode(mobileURL));
    console.log(`   URL: ${mobileURL}`);
  }
  
  console.log('\n🔧 CONFIGURATION NOTES:');
  console.log('-'.repeat(30));
  console.log('✅ Server is configured to accept connections from any IP');
  console.log('✅ Port 8080 is being used');
  console.log('✅ CORS is enabled for development');
  console.log('✅ Hot reload is enabled');
  
  console.log('\n📋 FIREWALL CONFIGURATION:');
  console.log('-'.repeat(30));
  console.log('If you cannot access from other devices:');
  console.log('1. Windows Firewall: Allow port 8080');
  console.log('   - Open "Windows Defender Firewall with Advanced Security"');
  console.log('   - Add "Inbound Rule" for port 8080');
  console.log('2. Router: Port forwarding (if accessing from internet)');
  console.log('   - Forward external port 8080 to your machine IP');
  console.log('3. Antivirus: May block network access');
  
  console.log('\n🚀 STARTING SERVER...');
  console.log('-'.repeat(30));
  
  // Iniciar o servidor Vite
  const { spawn } = require('child_process');
  const viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  viteProcess.on('close', (code) => {
    console.log(`\nServer stopped with code ${code}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    viteProcess.kill('SIGINT');
    process.exit(0);
  });
}

main().catch(console.error);
