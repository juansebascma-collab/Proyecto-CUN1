# HemoRed

MVP responsive para gestión operativa de inventario sanguíneo, solicitudes transfusionales, donantes y actividad basada en eventos.

## Tecnología

- Frontend: React + TypeScript + Vite
- Backend: Node.js + TypeScript + Fastify
- Persistencia preparada: MongoDB/Mongoose (soporta local y MongoDB Atlas)
- Arquitectura: monolito modular orientado a eventos
- Modelo de desarrollo: incremental

## Ejecutar

Requisitos: Node.js 20+ y pnpm.

```powershell
pnpm install
pnpm --filter hemored-server dev
pnpm --filter hemored-web dev
```

Abre `http://localhost:5173`. La API corre en `http://localhost:4000`.

### Cliente universal Native

También está disponible `app/`, una aplicación Expo + React Native Web que reutiliza la API y funciona en web, Android e iOS:

```powershell
pnpm --filter hemored-server dev
pnpm --filter hemored-app web
```

Abre `http://localhost:8081`. Para teléfono físico, configura `app/.env` con la IP LAN del equipo como `EXPO_PUBLIC_API_URL` y ejecuta `pnpm --filter hemored-app start`.

### Conexión a Base de Datos (MongoDB Atlas o Local)

Para conectar con MongoDB Atlas, configura el archivo `.env` en la raíz del proyecto (o en `server/.env`):

```env
MONGODB_URI=mongodb+srv://Arquitectura:Arquitectura2026@cluster0.xykjocm.mongodb.net/hemored?retryWrites=true&w=majority
PORT=4000
DEMO_MODE=false
```

Para probar la conexión a MongoDB Atlas directamente:

```powershell
pnpm --filter hemored-server test:mongo
```

Si prefieres levantar MongoDB localmente con Docker:

```powershell
docker compose up -d mongodb
```

## Verificación

```powershell
pnpm --filter hemored-server test
pnpm --filter hemored-server build
pnpm --filter hemored-web build
```

## Funcionalidades incluidas

- Dashboard con inventario disponible, alertas, solicitudes y donantes.
- Inventario demo por grupo sanguíneo y componentes.
- API para registrar unidades, donantes y solicitudes.
- Eventos `BloodUnitRegistered`, `DonorRegistered` y `TransfusionRequestCreated`.
- Dedupe de eventos por identificador.
- Diseño responsive con navegación adaptable a móvil.

Los datos del MVP son sintéticos y no deben usarse como sistema clínico productivo sin añadir autenticación, autorización, auditoría regulatoria e interoperabilidad HL7/FHIR.

Para crear un APK instalable directamente en Android:

```powershell
npx eas-cli login
pnpm --filter hemored-app build:apk
```

El perfil `production` genera un AAB para Google Play.
