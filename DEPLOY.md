# 🚀 Deploy Guide - FocusFlow AI

## 📋 Pré-requisitos

- Conta no [Netlify](https://netlify.com)
- Conta no [Supabase](https://supabase.com)
- Repositório GitHub
- Node.js 18+

## 🧪 Configuração do Supabase

1. **Criar Projeto:**
   - Acesse [supabase.com](https://supabase.com)
   - Clique "New Project"
   - Configure organização e projeto
   - Anote a URL e a API Key

2. **Obter Credenciais:**
   - Dashboard → Settings → API
   - Copie **Project URL** → `VITE_SUPABASE_URL`
   - Copie **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

## 🌐 Deploy no Netlify

### 1. **Conectar Repositório:**
1. Acesse [app.netlify.com](https://app.netlify.com)
2. "Add new site" → "Import an existing project"
3. Conecte ao GitHub
4. Selecione `adesignangola/focusflow-ai`

### 2. **Configurar Build:**
```
Build command: npm run build
Publish directory: dist
Node version: 18
```

### 3. **Variáveis de Ambiente:**
Vá para: `Site settings` → `Build & deploy` → `Environment`

#### **Variáveis Obrigatórias:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

#### **Variáveis Opcionais:**
```
VITE_GEMINI_API_KEY=your-gemini-key
VITE_AI_PROVIDER=gemini
VITE_DISABLE_PWA=false
```

### 4. **Deploy:**
- Clique "Deploy site"
- Aguarde o build completar
- Teste a aplicação

## � Instalação PWA (Telefone)

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
- ✅ Modo foco em tela cheia mobile

## �🔍 Verificação

### **Se aparecer "Failed to fetch":**
1. Verifique as variáveis de ambiente
2. Confirme a URL do Supabase
3. Teste a API key no navegador

### **Se aparecer tela de configuração:**
- O componente `ConfigCheck` está ativo
- Siga as instruções na tela
- Configure as variáveis no Netlify

## 🛠️ Debug Local

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Testar local
npm run dev

# Build de produção
npm run build
npm run preview
```

## 📱 PWA Configuration

Para habilitar PWA:
1. Configure `VITE_DISABLE_PWA=false`
2. O PWA está ativado no `vite.config.ts`
3. Faça novo deploy

## 🔄 Atualizações

### **Para atualizar o site:**
1. Faça push para GitHub
2. Netlify faz deploy automático
3. Ou clique "Trigger deploy" manualmente

### **Para atualizar variáveis:**
1. Vá para Environment variables
2. Edite as variáveis
3. Trigger new deploy

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

## 🚨 Problemas Comuns

### **"Failed to fetch"**
- ✅ Variáveis de ambiente não configuradas
- ✅ URL do Supabase incorreta
- ✅ API key inválida

### **"Página não encontrada"**
- ✅ Build command incorreto
- ✅ Publish directory errado
- ✅ _redirects ausente

### **"Tela branca"**
- ✅ Erro no build
- ✅ PWA conflitando
- ✅ JavaScript desabilitado

### **PWA não instala"**
- ✅ Site não está em HTTPS
- ✅ Manifest inválido
- ✅ Service worker ausente

## � Performance Monitor

```bash
# Verificar tamanho do bundle
npm run build
du -sh dist/*

# Testar performance
npx lighthouse https://seu-dominio.com
```

## 🚀 Scripts Úteis

```bash
# Deploy rápido
npm run build && netlify deploy --prod --dir=dist

# Testar PWA
npm run build && npm run preview

# Limpar cache
npm cache clean --force
```

## 📋 Deploy Checklist Final

- [ ] Build executou sem erros
- [ ] Testes passaram
- [ ] Variáveis de ambiente configuradas
- [ ] PWA manifest gerado
- [ ] Service worker funcionando
- [ ] Site está online
- [ ] Mobile responsivo
- [ ] Performance otimizada
- [ ] HTTPS configurado
- [ ] Domínio apontado
- [ ] PWA instala no celular

## �📞 Suporte

- [Documentação Netlify](https://docs.netlify.com)
- [Documentação Supabase](https://docs.supabase.com)
- [Issues GitHub](https://github.com/adesignangola/focusflow-ai/issues)
- [Comunidade Discord](https://discord.gg/focusflow)

---

**Após configurar as variáveis de ambiente, seu site funcionará perfeitamente no PC e no celular!** 🎉

### 📱 Links Úteis

- **Testar PWA:** [PWA Builder](https://www.pwabuilder.com/)
- **Validar Manifest:** [Manifest Validator](https://manifest-validator.appspot.com/)
- **Testar Service Worker:** [SW Tester](https://googlechrome.github.io/samples/service-worker/basic/)
