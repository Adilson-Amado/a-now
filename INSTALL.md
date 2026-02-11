# 📱 FocusFlow - Guia de Instalação

## 🖥️ Instalação no PC (Windows/Mac/Linux)

### Pré-requisitos
- Node.js 18+ 
- Git

### Passos
1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/focus-flow-ai.git
   cd focus-flow-ai
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas credenciais do Supabase
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse:** http://localhost:8080

### Build para Produção
```bash
npm run build
npm run preview
```

---

## 📱 Instalação no Telefone (PWA)

### Via Browser (Recomendado)
1. **Abra o app** no navegador do celular
2. **Toque no menu** (⋮) e selecione "Adicionar à tela inicial"
3. **Confirme** o nome e ícone
4. **Pronto!** O app aparecerá na tela inicial como um app nativo

### Funcionalidades PWA
- ✅ Funciona offline
- ✅ Notificações push
- ✅ Ícone na tela inicial
- ✅ Tela cheia
- ✅ Atalhos rápidos

---

## 🌐 Deploy (Produção)

### Netlify (Recomendado)
1. **Conecte seu repositório** ao Netlify
2. **Configure as variáveis de ambiente** no painel do Netlify
3. **Deploy automático** a cada push

### Vercel
1. **Importe o repositório** no Vercel
2. **Configure as variáveis de ambiente**
3. **Deploy automático**

### Render
1. **Conecte o repositório** ao Render
2. **Configure como Web Service**
3. **Deploy contínuo**

---

## ⚙️ Configuração Obrigatória

### Supabase
1. **Crie um projeto** em [supabase.com](https://supabase.com)
2. **Copie as credenciais:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. **Configure no arquivo .env**

### Google Gemini AI (Opcional)
1. **Obtenha uma API Key** em [Google AI Studio](https://aistudio.google.com)
2. **Configure:** `VITE_GEMINI_API_KEY`

---

## 📱 Otimizações Mobile

### Design Responsivo
- ✅ Layout adaptativo para todas as telas
- ✅ Toques e gestos otimizados
- ✅ Performance otimizada para mobile

### Funcionalidades Específicas
- ✅ **Modo Foco em tela cheia** (mobile)
- ✅ **Notificações push** nativas
- ✅ **Atalhos** na tela inicial
- ✅ **Compartilhamento** de tarefas
- ✅ **Instalação offline**

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Servidor local
npm run dev:network      # Acessível na rede

# Build
npm run build            # Build de produção
npm run build:dev        # Build de desenvolvimento

# Testes
npm run test             # Executar testes
npm run test:watch       # Testes em modo watch

# Utilitários
npm run lint             # Verificar código
npm run preview          # Previsualizar build
```

---

## 📋 Checklist de Deploy

### Antes do Deploy
- [ ] Configurar variáveis de ambiente
- [ ] Testar build localmente
- [ ] Otimizar imagens
- [ ] Testar PWA no mobile

### Pós-Deploy
- [ ] Testar instalação PWA
- [ ] Verificar notificações
- [ ] Testar modo offline
- [ ] Validar responsividade

---

## 🔧 Troubleshooting

### Problemas Comuns
1. **"PWA não instala"** → Verifique se o site está em HTTPS
2. **"Notificações não funcionam"** → Peça permissão ao usuário
3. **"Modo tela cheia falha"** → Teste em diferentes browsers
4. **"Build falha"** → Verifique variáveis de ambiente

### Suporte
- 📧 Email: support@focusflow.app
- 💬 Discord: [Comunidade FocusFlow](https://discord.gg/focusflow)
- 📖 Docs: [focusflow.app/docs](https://focusflow.app/docs)

---

## 📱 Teste em Dispositivos

### Android
- Chrome: ✅ Completo
- Firefox: ✅ Completo  
- Samsung Browser: ✅ Completo

### iOS
- Safari: ✅ Completo
- Chrome: ✅ Completo

### Desktop
- Chrome: ✅ Completo
- Firefox: ✅ Completo
- Safari: ✅ Completo
- Edge: ✅ Completo
