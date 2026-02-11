# Plano de Configuração da API Gemini

## Objetivo
Configurar a API Gemini no Focus Flow AI para habilitar funcionalidades de IA.

## Tarefas

### 1. Configurar Variáveis de Ambiente no Frontend
- Criar/editar arquivo `.env.local`
- Adicionar `VITE_GEMINI_API_KEY`

### 2. Configurar Segredo no Supabase
- Configurar `GEMINI_API_KEY` nos secrets do Supabase

### 3. Corrigir syncService.ts (Problema Identificado)
- Alterar referências de `tasks` → `sync_tasks`
- Alterar referências de `notes` → `sync_notes`
- Alterar referências de `goals` → `sync_goals`
- Implementar método `processSyncQueue()`

## Variáveis Necessárias

| Local | Variável | Valor |
|-------|----------|-------|
| Frontend (.env.local) | VITE_GEMINI_API_KEY | AIzaSyCxpUGnAmqWqSLS5vGduG6x6rG7TyMlYFI |
| Supabase Secrets | GEMINI_API_KEY | AIzaSyCxpUGnAmqWqSLS5vGduG6x6rG7TyMlYFI |

## Arquivos a Modificar

1. `.env.local` - Criar com API Key
2. `src/services/syncService.ts` - Corrigir nomes de tabelas
3. `supabase/secrets` - Configurar via CLI
