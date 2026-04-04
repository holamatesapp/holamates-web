import Client from 'ssh2-sftp-client';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// 📂 TU PROYECTO HTML
const localPath = path.resolve('./');

// 📍 DESTINO IONOS
const remotePath = '../holamates/holamatesweb/';

// 🔐 SERVIDOR
const host = 'access-5017607127.webspace-host.com';
const port = 22;
const username = 'a1713162';

// 🚫 EXCLUSIONES (CLAVE 🔥)
const exclude = [
  'node_modules',
  '.git',
  '.DS_Store',
  'package.json',
  'package-lock.json',
  'deploy-web.js'
];

// 🔑 PEDIR PASSWORD
const askPassword = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.stdoutMuted = true;

    rl.question('Introduce la contraseña de IONOS: ', (password) => {
      rl.close();
      resolve(password);
    });

    rl._writeToOutput = function () {
      rl.output.write('*');
    };
  });
};

async function deploy() {
  const sftp = new Client();
  const password = await askPassword();

  let uploaded = 0;

  try {
    console.log('\n🔌 Conectando a IONOS...');
    await sftp.connect({ host, port, username, password });

    // 📁 entrar en htdocs
    await sftp.cwd('kunden/homepages/34/d4298918860/htdocs');

    // asegurar carpeta destino
    await sftp.mkdir(remotePath, true);

    console.log('📁 Subiendo proyecto HTML...');

    const uploadDir = async (localDir, remoteDir) => {
      const files = fs.readdirSync(localDir);

      for (const file of files) {

        // 🚫 ignorar basura
        if (exclude.includes(file)) continue;

        const localFile = path.join(localDir, file);
        const remoteFile = remoteDir + file;
        const stat = fs.statSync(localFile);

        if (stat.isDirectory()) {

          try {
            await sftp.mkdir(remoteFile, true);
          } catch {}

          await uploadDir(localFile, remoteFile + '/');

        } else {

          await sftp.fastPut(localFile, remoteFile);
          uploaded++;
          console.log('   ↳ Subido:', remoteFile);
        }
      }
    };

    await uploadDir(localPath + '/', remotePath);

    console.log('\n===================================');
    console.log('✅ DEPLOY WEB COMPLETADO');
    console.log('📦 Archivos subidos:', uploaded);
    console.log('===================================\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    sftp.end();
  }
}

deploy();