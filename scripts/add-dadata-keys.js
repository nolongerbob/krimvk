const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function addDaDataKeys() {
  const envPath = path.join(process.cwd(), '.env');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const apiKey = await new Promise(resolve => {
    rl.question('Введите DADATA_API_KEY (или Enter для пропуска): ', answer => {
      resolve(answer.trim());
    });
  });

  const secretKey = await new Promise(resolve => {
    rl.question('Введите DADATA_SECRET_KEY (или Enter для пропуска): ', answer => {
      resolve(answer.trim());
    });
  });

  // Удаляем старые ключи если есть
  envContent = envContent.split('\n')
    .filter(line => !line.startsWith('DADATA_API_KEY=') && !line.startsWith('DADATA_SECRET_KEY='))
    .join('\n');

  // Добавляем новые ключи
  if (apiKey) {
    envContent += `\nDADATA_API_KEY="${apiKey}"`;
  }
  if (secretKey) {
    envContent += `\nDADATA_SECRET_KEY="${secretKey}"`;
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log('✅ Ключи DaData добавлены в .env');
  
  rl.close();
}

addDaDataKeys();







