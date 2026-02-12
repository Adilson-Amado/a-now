# 🚀 Configuração da API Gemini para FocusFlow

## ❗ Problema Atual
O sistema de IA está apresentando o erro "Falha ao gerar detalhes da tarefa" porque não há uma chave de API Gemini configurada.

## 📋 Passos para Resolver

### 1. Copiar Arquivo de Configuração
```bash
copy .env.example .env
```

### 2. Obter Chave API Gemini
1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 3. Configurar o Arquivo .env
Abra o arquivo `.env` e substitua:
```env
VITE_GEMINI_API_KEY=your-gemini-api-key
```
Por:
```env
VITE_GEMINI_API_KEY=COLE_SUA_CHAVE_AQUI
```

### 4. Reiniciar o Servidor
```bash
npm run dev
```

## 🔍 Verificação

Após configurar, você deverá ver no console:
- ✅ "Gemini API key loaded successfully"
- 🚀 "Starting AI task generation for: [título]"

## 🛠️ Logs Adicionados

O sistema agora inclui logs detalhados para diagnóstico:
- ❌ Erro de API key não configurada
- 📤 Envio de requisição para API
- 📥 Resposta recebida
- 🔍 Processamento do JSON
- ✅ Sucesso ou ⚠️ Fallback

## 📞 Suporte

Se o problema persistir após configurar a API key:
1. Verifique se a chave está correta
2. Confirme se há cotas disponíveis na API
3. Verifique os logs no console do navegador

## 🔐 Segurança

- Nunca compartilhe sua API key
- O arquivo .env está no .gitignore para segurança
- Use chaves diferentes para desenvolvimento e produção
