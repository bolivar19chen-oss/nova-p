# Publicar Pet Nova en Vercel

## Antes de empezar

Verifica que la migracion a Postgres este terminada. Si `server/db.ts` todavia usa
`readFileSync` o `writeFileSync`, NO despliegues: los datos se van a perder.

```bash
grep -c "writeFileSync" server/db.ts
```

Si da algo distinto de 0, la migracion no termino.

## 1. Subir el codigo a GitHub

`.gitignore` ya protege `.env`, `server/data.json` y `node_modules`. Aun asi, revisa
que no se cuele nada antes del primer push:

```bash
git status
```

Si aparece `.env` en la lista, PARA. Significa que .gitignore no lo esta tomando.

```bash
git init
git add .
git commit -m "Pet Nova"
git branch -M main
git remote add origin TU_REPO_DE_GITHUB
git push -u origin main
```

## 2. Importar en Vercel

1. Entra a vercel.com e inicia sesion con GitHub
2. Add New, Project, elegi el repositorio
3. Vercel va a leer `vercel.json` solo. NO cambies el Build Command ni el Output
   Directory: ya estan definidos ahi.

## 3. Variables de entorno

En Vercel, Settings, Environment Variables. Agrega estas dos:

| Nombre | De donde sale |
|---|---|
| `DATABASE_URL` | La cadena de Neon. Esta en tu `.env` local |
| `JWT_SECRET` | El valor de tu `.env` local. NO uses el de ejemplo |

Marcalas para Production, Preview y Development.

Importante: sin `JWT_SECRET` el servidor se niega a arrancar en produccion, a proposito.
Es la proteccion contra publicar con un secreto conocido.

## 4. Desplegar

Deploy. Vercel construye el frontend con Vite y publica `api/index.ts` como funcion
serverless.

## 5. Comprobar que quedo bien

Reemplaza TU-URL por la que te de Vercel:

```bash
curl https://TU-URL.vercel.app/api/alerts
```

Deberia responder una lista, aunque sea vacia. Si da 500, mira los logs en Vercel,
casi siempre es una variable de entorno faltante.

Despues, en el navegador: crea una cuenta, cierra sesion, y volve a entrar. Si podes
entrar, la base de datos esta funcionando de verdad.

---

## Limitacion conocida: las fotos subidas

`server/index.ts` sirve las fotos desde disco y `multer` las guarda ahi. En Vercel el
disco es efimero, asi que **las fotos que suban los usuarios van a desaparecer**.

La base de datos resuelve los registros, no las imagenes. Son dos problemas distintos.

Opciones, ninguna implementada todavia:
1. Guardar las fotos en almacenamiento de objetos. El proyecto ya tiene
   `@aws-sdk/client-s3` instalado, aunque sin usar.
2. Usar Vercel Blob, que se integra directo.
3. Guardar la imagen en la base como base64. Simple pero pesado, sirve para una demo.

Mientras tanto la app funciona: si la subida falla, el codigo cae a la vista previa
local en base64 y no se rompe.

## Alternativa si Vercel se complica

El proyecto ya tiene `render.yaml` con un disco persistente. En Render funciona el
guardado en archivo Y las fotos en disco, sin migrar nada. Es menos moderno pero para
una demo alcanza y sobra.
