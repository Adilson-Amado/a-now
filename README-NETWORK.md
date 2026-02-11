# 🌐 ACESSO REDE - FOCUSFLOW

## 🚀 INICIAR SERVIDOR COM ACESSO EXTERNO

### Método 1: Script Automático (Recomendado)
```bash
npm run dev:network
```

### Método 2: Manual
```bash
npm run dev
```

## 📱 COMO ACESSAR DE OUTROS DISPOSITIVOS

### 1. Encontrar seu IP
Execute o script `npm run dev:network` para ver todos os IPs disponíveis:

```
🌐 FOCUSFLOW - NETWORK ACCESS CONFIGURATION
==================================================

📱 ACCESS URLS:
------------------------------

🏠 Local Access:
   http://localhost:8080
   http://127.0.0.1:8080

🌍 Network Access:
   http://192.168.1.100:8080
   └─ Interface: Wi-Fi (Local Network)
   http://10.0.0.5:8080
   └─ Interface: Ethernet (Private Network)

📱 MOBILE ACCESS (QR Code):
   Scan this QR code with your phone:
   ██████████████████████████████
   ██ ▄▄▄▄▄ █▀▄ ▄▀█▄▀▄ ▄▄▄▄▄ ██
   ██ █   █ █▄▀▀▀▄█ █▄▄ █   █ ██
   ██ █▄▄▄█ █▄▄ ▄▄ █▄█▄█ █▄▄▄█ ██
   ██▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
   ██████████████████████████████
   URL: http://192.168.1.100:8080
```

### 2. Acessar do Celular
- **Wi-Fi**: Use o IP da rede local (ex: `http://192.168.1.100:8080`)
- **Dados Móveis**: Requer configuração de port forwarding no roteador

### 3. Acessar de Outro Computador
- **Mesma Rede**: Use o IP da rede local
- **Rede Diferente**: Requer IP público e port forwarding

## 🔧 CONFIGURAÇÃO NECESSÁRIA

### Windows Firewall
1. Abra "Windows Defender Firewall with Advanced Security"
2. Clique em "Inbound Rules" → "New Rule..."
3. Selecione "Port" → "TCP" → "Specific ports: 8080"
4. "Allow the connection"
5. Selecione todos os perfis (Domain, Private, Public)
6. Nome: "FocusFlow Dev Server"

### Roteador (Acesso Externo)
1. Acesse o painel do roteador (geralmente 192.168.1.1)
2. Encontre "Port Forwarding" ou "Virtual Server"
3. Configure:
   - External Port: 8080
   - Internal Port: 8080
   - Internal IP: [IP do seu computador]
   - Protocol: TCP

### Antivírus
- Adicione exceção para porta 8080
- Desative temporariamente para teste

## 📱 TESTE DE CONEXÃO

### Teste Local
```bash
# Testar se o servidor está respondendo
curl http://localhost:8080

# Testar acesso via IP
curl http://192.168.1.100:8080
```

### Teste Mobile
1. Conecte o celular na mesma rede Wi-Fi
2. Abra o navegador e acesse o IP mostrado
3. Teste as notificações PWA

## 🚨 PROBLEMAS COMUNS

### ❌ "Connection Refused"
- Firewall bloqueando a porta 8080
- Servidor não iniciado
- IP incorreto

### ❌ "Connection Timeout"
- Rede diferente sem port forwarding
- Roteador bloqueando
- Antivírus interferindo

### ❌ "Site cannot be reached"
- IP errado
- Servidor parou
- Problema de DNS

## 🛠️ FERRAMENTAS ÚTEIS

### Verificar IPs
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
ip addr
```

### Testar Porta
```bash
# Testar se porta está aberta
telnet 192.168.1.100 8080

# Ou usar nmap
nmap -p 8080 192.168.1.100
```

### Verificar Processos
```bash
# Verificar se Vite está rodando
netstat -ano | findstr :8080
```

## 🌐 ACESSO PÚBLICO (OPCIONAL)

### Usando ngrok (Recomendado para testes)
```bash
# Instalar ngrok
npm install -g ngrok

# Iniciar ngrok
ngrok http 8080

# Acesse a URL gerada: https://abc123.ngrok.io
```

### Configuração ngrok no projeto
Adicione ao package.json:
```json
{
  "scripts": {
    "dev:public": "concurrently \"npm run dev\" \"ngrok http 8080\""
  }
}
```

## 📋 CHECKLIST DE CONFIGURAÇÃO

- [ ] Servidor iniciado com `npm run dev:network`
- [ ] Firewall configurado para porta 8080
- [ ] Dispositivos na mesma rede
- [ ] IP correto sendo usado
- [ ] Antivírus configurado
- [ ] Roteador configurado (acesso externo)
- [ ] Teste local funcionando
- [ ] Teste mobile funcionando

## 🎯 DICA RÁPIDA

Para acesso rápido na mesma rede:
1. Execute `npm run dev:network`
2. Copie o primeiro IP de "Network Access"
3. Cole no navegador do outro dispositivo
4. Pronto! 🚀
