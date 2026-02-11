const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurações
const config = {
  autoCommit: true,
  autoPush: true,
  commitMessage: '🔄 Auto-sync: Update project files',
  checkInterval: 5000, // 5 segundos
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.git/',
    '*.log',
    '.env*',
    'coverage/',
    '.cache/'
  ]
};

// Função para verificar se há alterações
function hasChanges() {
  try {
    const status = execSync('"C:\\Program Files\\Git\\bin\\git.exe" status --porcelain', { encoding: 'utf8' });
    return status.trim().length > 0;
  } catch (error) {
    console.error('Erro ao verificar status do Git:', error.message);
    return false;
  }
}

// Função para obter arquivos alterados
function getChangedFiles() {
  try {
    const status = execSync('"C:\\Program Files\\Git\\bin\\git.exe" status --porcelain', { encoding: 'utf8' });
    return status.split('\n')
      .filter(line => line.trim())
      .map(line => line.substring(3).trim())
      .filter(file => !config.ignorePatterns.some(pattern => file.includes(pattern)));
  } catch (error) {
    console.error('Erro ao obter arquivos alterados:', error.message);
    return [];
  }
}

// Função para fazer commit automático
function autoCommit() {
  try {
    console.log('🔄 Detectando alterações...');
    
    if (!hasChanges()) {
      console.log('✅ Nenhuma alteração detectada.');
      return;
    }

    const changedFiles = getChangedFiles();
    if (changedFiles.length === 0) {
      console.log('✅ Nenhum arquivo relevante alterado.');
      return;
    }

    console.log(`📝 Arquivos alterados: ${changedFiles.join(', ')}`);

    // Adicionar arquivos alterados
    execSync('"C:\\Program Files\\Git\\bin\\git.exe" add .', { encoding: 'utf8' });
    console.log('✅ Arquivos adicionados ao staging area.');

    // Fazer commit
    const timestamp = new Date().toLocaleString('pt-PT');
    const message = `${config.commitMessage} (${timestamp})`;
    
    execSync(`"C:\\Program Files\\Git\\bin\\git.exe" commit -m "${message}"`, { encoding: 'utf8' });
    console.log('✅ Commit realizado com sucesso.');

    // Fazer push se configurado
    if (config.autoPush) {
      try {
        execSync('"C:\\Program Files\\Git\\bin\\git.exe" push origin main', { encoding: 'utf8' });
        console.log('🚀 Push enviado para GitHub com sucesso!');
      } catch (pushError) {
        console.error('❌ Erro ao fazer push:', pushError.message);
        console.log('💡 Commit feito localmente, mas push falhou. Verifique sua conexão ou autenticação.');
      }
    }

  } catch (error) {
    console.error('❌ Erro no auto-sync:', error.message);
  }
}

// Função principal de monitoramento
function startAutoSync() {
  console.log('🚀 Iniciando sincronização automática...');
  console.log(`⏱️ Intervalo de verificação: ${config.checkInterval / 1000} segundos`);
  console.log('📁 Monitorando alterações nos arquivos...');
  console.log('⚠️ Pressione Ctrl+C para parar.\n');

  // Verificar imediatamente
  autoCommit();

  // Configurar verificação periódica
  const interval = setInterval(() => {
    autoCommit();
  }, config.checkInterval);

  // Limpar ao sair
  process.on('SIGINT', () => {
    console.log('\n🛑 Parando sincronização automática...');
    clearInterval(interval);
    console.log('👋 Até logo!');
    process.exit(0);
  });
}

// Iniciar se executado diretamente
if (require.main === module) {
  startAutoSync();
}

module.exports = { autoCommit, startAutoSync, config };
