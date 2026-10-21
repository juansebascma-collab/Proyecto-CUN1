import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

function loadEnv() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'server', '.env'),
    path.resolve(currentDir, '..', '..', '.env'),
    path.resolve(currentDir, '..', '.env'),
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq !== -1) {
          const key = trimmed.slice(0, eq).trim();
          const val = trimmed.slice(eq + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      console.log(`[Env] Cargado desde: ${envPath}`);
      return;
    }
  }
}

loadEnv();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI no está definido en el archivo .env');
    process.exit(1);
  }

  // Ocultar la contraseña en el log para seguridad
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log(`Intentando conectar a: ${maskedUri}`);

  try {
    const conn = await mongoose.connect(uri);
    console.log('✅ ¡Conexión exitosa a MongoDB Atlas!');
    console.log(`📡 Base de datos actual: ${conn.connection.name}`);
    console.log(`🖥️ Host: ${conn.connection.host}`);

    if (conn.connection.db) {
      const adminDb = conn.connection.db.admin();
      const pingResult = await adminDb.ping();
      console.log('📶 Ping a MongoDB Atlas:', pingResult);

      const collections = await conn.connection.db.listCollections().toArray();
      console.log('📁 Colecciones disponibles:', collections.map((c) => c.name));
    }

    await mongoose.disconnect();
    console.log('🔌 Desconectado correctamente.');
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    process.exit(1);
  }
}

run();
