# Pet Nova

## Cómo correrlo en tu computadora (o en Claude Code)

```bash
npm install          # instala dependencias (o: pnpm install)

# Desarrollo (dos procesos):
npm run dev:server    # backend real en el puerto 3001
npm run dev           # frontend (Vite) en el puerto 3000, con recarga en vivo

# Producción (un solo proceso, lo que se usa al desplegar):
npm run build
npm start             # sirve frontend + API juntos en el puerto 3000
```

## Qué se arregló en esta sesión

- **El backend real nunca se ejecutaba.** `package.json` apuntaba a un
  servidor viejo de scaffold (`server/_core/index.ts`, tRPC + OAuth) que no
  monta ninguna de las rutas reales (`/api/auth`, `/api/appointments`, etc.).
  Ahora `dev` / `build` / `start` usan `server/index.ts`, que sí monta
  `server/routes.ts` — el backend que el frontend realmente llama.
- **`server/db.ts` estaba mal** (una versión vieja sin la función `db.get/save`
  que usa `routes.ts`). Se reemplazó por el almacenamiento real en archivo
  JSON (`server/data.json`), persistente entre reinicios.
- **`vite.config.ts` dependía de plugins internos de Manus**
  (`vite-plugin-manus-runtime`) que no están disponibles fuera de su
  plataforma — esto habría roto `npm install` en cualquier otro lado. Se
  quitaron y se agregó un proxy de `/api` hacia el backend para desarrollo
  local.
- **Mapa Pet** ahora usa un mapa real (Leaflet + OpenStreetMap, sin API key)
  con veterinarias/parques/peluquerías reales y un simulador de "paseador en
  camino" en vivo, conectado al backend existente (`/api/tracking/...`).
- **Logo real** (`client/public/pet-nova-logo.svg`) — antes la imagen
  referenciada no existía.
- **Configuración real y funcional**: editar perfil, editar información de
  la mascota (con foto), cambiar correo, cambiar contraseña y cerrar sesión
  ahora sí llaman al backend (antes eran botones decorativos).
- Menús "We Care" / "In My Pet" / "Acción" con clic **y** hover, veterinaria
  elegible por lista (conectada a las mismas ubicaciones del mapa) en vez de
  texto libre.

## Cómo publicarlo con una URL propia

Ya incluye `render.yaml`. En [Render.com](https://render.com): **New →
Blueprint**, conecta el repo, y configura automáticamente el build
(`pnpm build`), el arranque (`pnpm start`), un `JWT_SECRET` aleatorio y disco
persistente para que citas/fotos/comunidad no se borren en cada despliegue.

## Variables de entorno

Copia `.env.example` a `.env` antes de desplegar en público y cambia
`JWT_SECRET`. Nada más es obligatorio — el mapa no necesita ninguna API key.
