import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './interfaces/http.js';
import { connectMongo, DomainEventModel } from './infrastructure/mongo.js';
import { MongoStore } from './infrastructure/mongo-store.js';
import { DemoStore } from './infrastructure/demo-repositories.js';
import { EventBus } from './application/event-bus.js';

// Carga de variables de entorno desde .env sin dependencias externas
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
      if (typeof (process as any).loadEnvFile === 'function') {
        try {
          (process as any).loadEnvFile(envPath);
          console.log(`[Env] Archivo cargado mediante loadEnvFile: ${envPath}`);
          return;
        } catch {}
      }
      try {
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
        console.log(`[Env] Variables cargadas exitosamente desde: ${envPath}`);
        return;
      } catch {}
    }
  }
}

loadEnv();

async function start() {
  const isDemo = process.env.DEMO_MODE === 'true';
  const mongoUri = process.env.MONGODB_URI;
  const bus = new EventBus();
  let store: any = new DemoStore();

  if (!isDemo && mongoUri) {
    try {
      console.log('🔄 Conectando a MongoDB Atlas...');
      await connectMongo(mongoUri);
      console.log('✅ Conexión establecida con éxito a MongoDB Atlas.');

      const mongoStore = new MongoStore();
      const demo = new DemoStore();
      // Inicializar colecciones con datos de demostración si están vacías
      await mongoStore.seedIfEmpty(demo.units, demo.donors, demo.requests);
      store = mongoStore;

      // Persistir eventos de dominio en MongoDB
      bus.subscribe(async (event) => {
        try {
          await DomainEventModel.create(event);
        } catch (err) {
          console.error('Error guardando evento en Mongo:', err);
        }
      });
    } catch (error) {
      console.error('❌ Error al conectar a MongoDB Atlas:', error);
      console.warn('⚠️ Iniciando en modo Demo en memoria como fallback.');
      store = new DemoStore();
    }
  } else {
    console.log('ℹ️ Servidor iniciado en modo DEMO_MODE.');
  }

  const app = buildApp(store, bus);
  const port = Number(process.env.PORT || 4000);

  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 HemoRed API corriendo en http://localhost:${port} (Modo: ${store.mode})`);
}

start().catch((err) => {
  console.error('Error fatal al iniciar la aplicación:', err);
  process.exit(1);
});
