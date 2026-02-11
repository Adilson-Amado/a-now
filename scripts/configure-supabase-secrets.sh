#!/bin/bash
# Script para configurar os segredos do Supabase

echo "Configurando segredos do Supabase..."

# Configurar GEMINI_API_KEY
echo "Configurando GEMINI_API_KEY..."
supabase secrets set GEMINI_API_KEY=AIzaSyCxpUGnAmqWqSLS5vGduG6x6rG7TyMlYFI

echo ""
echo "Segredos configurados com sucesso!"
echo ""
echo "Verificando segredos configurados:"
supabase secrets list
