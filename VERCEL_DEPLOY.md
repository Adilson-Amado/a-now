# Deploy no Vercel

## Configuração

### 1. Variables de Ambiente no Vercel

No painel do Vercel, adicione as seguintes variáveis de ambiente:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase |
| `VITE_GEMINI_API_KEY` | API Key do Gemini (opcional) |
| `VITE_DISABLE_PWA` | `true` |
| `VITE_AI_PROVIDER` | `gemini` |

### 2. Deploy Automático

1. Conecte seu repositório ao Vercel
2. O Vercel detectará automaticamente as configurações do `vercel.json`
3. Faça o deploy

### 3. Configuração do Supabase para Vercel

Certifique-se de que o Supabase tem as URLs do Vercel configuradas em:
- **Authentication > URL Configuration > Site URL**: URL do seu projeto Vercel
- **Authentication > URL Configuration > Redirect URLs**: URL do seu projeto Vercel

### 4. Edge Functions do Supabase

Para usar as Edge Functions do Supabase:
1. Configure o Supabase CLI localmente
2. Execute: `supabase link --project-id seu-project-id`
3. Deploy das functions: `supabase functions deploy`

### 5. Variáveis no Supabase Secrets

Para as Edge Functions funcionarem, configure os segredos no Supabase:

```bash
npx supabase secrets set GEMINI_API_KEY=sua-chave-gemini
```
