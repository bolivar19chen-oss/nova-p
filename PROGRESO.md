# Pet Nova - Progreso

Ultima actualizacion: 2026-08-02

## Como retomar

1. Backend: `cd "C:\Users\Usuario\Desktop\Nueva carpeta"; $env:PORT=3001; npx tsx server/index.ts`
2. Frontend: `pnpm dev` (puerto 3000, proxy a 3001)
3. El idioma por defecto es ingles. Para ver el sitio en espaniol:
   `sessionStorage.setItem("petNovaLanguage","es")` en la consola del navegador.

Typecheck: `npx tsc --noEmit`. Hay 7 errores preexistentes en codigo muerto
(`server/_core/*`, `DashboardLayout.tsx`, `useAuth.ts`). No son regresiones, ignorarlos.
Cualquier error fuera de esos archivos SI es nuevo.

---

## Terminado y verificado en navegador

### Design system
- Tokens de marca en `client/src/index.css` con `@theme` (Tailwind v4, no hay tailwind.config).
  - `brand-purple` #523f7a, `brand-purple-light` #8268d5, `brand-cyan` #0cc0df, `brand-red` #e23b3b
  - Verificado: los 4 hex aparecen en el CSS compilado.
  - Generan utilidades reales: `bg-brand-purple`, `border-brand-purple`, `from-brand-purple`, etc.
- `client/src/components/PageHeader.tsx`: header reutilizable con ArrowLeft.

### Nav (Dashboard.tsx)
Estructura verificada midiendo el DOM en el navegador:
- 4 iconos: Home, Accion, Desinformacion, Desorganizacion
- Al activar un icono aparece debajo una pastilla horizontal con el nombre de la seccion
- Debajo de la pastilla, la lista vertical de items con icono chico
- Pastilla: `border-brand-purple` medido en rgb(82,63,122), subrayado `border-b-brand-cyan` en rgb(12,192,223)

Contenido de cada seccion (confirmado por el usuario, el mockup esta desactualizado en este punto):
- Home: sin items
- Accion: Alerta Paw, Denuncias Anonimas
- Desinformacion: We Care (Sitio informativo de mascotas), Jornadas de Vacunacion
- Desorganizacion: My Pet Community, Paw Planner, Huellitas al Camino, Pet Moments

### Pagina Desinformacion (`client/src/pages/Desinformacion.tsx`)
- Dos pastillas: cyan "We Care", roja "Jornadas de Vacunacion"
- Bloque izquierdo: 6 articulos con "Leer mas", abren Dialog
- Bloque derecho: 3 jornadas con "Ver detalles"
- Ruteada desde `pageView === "info-site" || "vaccination-days"`, ambos items del menu abren esta pagina
- `InfoSite.tsx` y `VaccinationDays.tsx` quedaron SIN USO, los reemplaza esta pagina

### Pet Moments (`client/src/pages/PetMoments.tsx`)
Tres vistas con estado local `view: "profile" | "albums" | "album"`:
1. Perfil: avatar, nombre con corazon, raza, edad, stats 28/156/32, grid 3x2
2. Grid de albumes: tiles con fotos apiladas y rotadas
3. Scrapbook: cuaderno con espiral, polaroids con cinta, post-it, stickers, flechas

Verificado en 375px: sin scroll horizontal, polaroids dentro de pantalla.
En mobile muestra una sola pagina del cuaderno (`grid-cols-1 md:grid-cols-2`).

### Logo (`client/src/components/Logo.tsx`)
- SVG en linea con `fill="currentColor"`, se recolorea con `className="text-white"` etc.
- Wordmark y lema como HTML con fuente Geist, no como `<text>` de SVG
- Props: `{ variant?: "mark" | "full"; size?: number; className?: string }`
- `client/public/pet-nova-mark.svg` y `pet-nova-logo.svg`: sin `<rect>` de fondo, transparentes

---

## LOGO: RESUELTO

El arte original aparecio en una version vieja del proyecto:
`Downloads/pet-nova-app-mejorada/pet-nova/client/public/pet-nova-logo.jpg`
Era JPG, formato sin transparencia. De ahi el "se ve el fondo y queda horrible".

Se extrajo con Pillow calculando alfa por distancia al fondo crema (246,245,243),
con rampa para conservar bordes suavizados, recorte al contenido, y separacion del
simbolo detectando la columna vacia entre el dibujo y el wordmark.
Script en el scratchpad: extraer_logo.py

Resultado en client/public/, los cuatro con fondo transparente:
  pet-nova-logo.png        882x269  lockup completo, morado
  pet-nova-mark.png        340x269  solo perro y gato, morado
  pet-nova-logo-white.png  882x269  lockup en blanco, para fondos oscuros
  pet-nova-mark-white.png  340x269  simbolo en blanco

`client/src/components/Logo.tsx` los sirve. Props:
  { variant?: "mark" | "full"; tone?: "color" | "white"; size?: number; className?: string }

Ya conectado en Dashboard (variant mark, el header lleva el nombre al lado),
Login y Registration (variant full). Los SVG falsos de la huella fueron borrados.

Son PNG y no SVG porque el arte que entrego el equipo es un JPG, no un vector.
Si aparece el vector, reemplazar los archivos y actualizar SRC en Logo.tsx.

## NAV: expansion tipo pildora

El usuario eligio la mecanica del snippet original en vez de la pastilla separada.
- Boton en reposo: circulo blanco 60x60. Activo: w-[180px] con gradiente de marca,
  icono a scale-0 y nombre entrando con delay-150.
- La pastilla separada fue eliminada. El nombre ya no aparece duplicado.
- Para que el nav no salte: cada boton vive en un slot fijo `w-[60px] h-[60px] shrink-0`
  y el boton es absolute z-10, asi crece flotando sin empujar a los hermanos.
- Verificado: nav mide 264x60 antes y despues de expandir, los hermanos no se mueven.
- OJO: al expandir a 180px dentro de un slot de 60px, el boton TAPA a los iconos
  vecinos. Falta que el usuario lo mire en un navegador real y diga si le sirve.

## AUDITORIA DE SEGURIDAD

Hallazgos verificados en el codigo. Al momento de escribir esto hay un agente
arreglandolos, revisar si ya estan cerrados antes de volver a tocarlos.

1. AISLAMIENTO DE DATOS, critico.
   server/routes.ts:108 -> `apiRouter.get("/appointments", (_req, res) => ...)`
   Ni siquiera lee el request. Cada usuario ve citas, vacunas y alertas de todos.
   Los DELETE borran por id sin verificar dueno.

2. RUTA ROTA, nadie la habia visto.
   server/routes.ts:57 -> `apiRouter.get("\auth\me", ...)` con BARRAS INVERTIDAS.
   En JS "\a" es "a" y "\m" es "m", asi que la ruta queda registrada como "authme".
   El endpoint /auth/me nunca existio.

3. JWT_SECRET con fallback publico.
   server/auth.ts:8 -> `process.env.JWT_SECRET || "pet-nova-dev-secret-change-me"`
   Publicado sin la variable, cualquiera puede fabricar sesiones validas.

4. NO EXISTE .gitignore.
   Al subir a GitHub se publicarian server/data.json con los hashes de contrasenas,
   node_modules, dist y cualquier .env futuro.

5. LOGIN: la parte de autenticacion YA ESTABA BIEN.
   server/routes.ts:47-55 busca el usuario, verifica el hash con bcrypt y devuelve
   401 generico. El usuario creia que dejaba pasar cuentas inexistentes, y no es asi.
   Lo que faltaba: validar formato de email, exigir largo minimo de contrasena,
   normalizar email a minusculas al guardar, y limitar intentos por fuerza bruta.

## DESPLIEGUE

Decision del usuario: VERCEL.

BLOQUEO REAL: hoy el backend guarda en `server/data.json` con fs.writeFileSync.
Vercel es serverless, el disco es de solo lectura salvo /tmp, y /tmp se borra entre
invocaciones. Los datos se perderian. NO se puede publicar en Vercel sin migrar
el almacenamiento a una base de datos.

Base elegida: NEON, Postgres serverless. Falta que el usuario cree la cuenta en
neon.tech y entregue la cadena de conexion `postgresql://...`. Sin eso no se avanza.

OJO con Drizzle: el proyecto tiene drizzle-orm, mysql2, drizzle.config.ts y un schema,
pero apuntan a MYSQL y NO LOS USA NADIE. Es andamiaje muerto de Manus. Con Neon hay
que pasarlo a Postgres o descartarlo.

Alternativa si Vercel se complica: RENDER. El proyecto ya tiene render.yaml con disco
persistente y funcionaria casi sin cambios, incluso con el archivo JSON.

## FUGA DE COLORES EN TODO EL PROYECTO

16 archivos y unas 55 ocurrencias usaban colores genericos de Tailwind
(purple-500, cyan-600, etc) en vez de los tokens de marca. No era un descuido
puntual: el proyecto viejo entero se pinto asi y nunca se migro.
Hay un agente migrandolos. Mapeo acordado:
  purple-600/700 -> brand-purple | purple-500/400 -> brand-purple-light
  cyan-500/600   -> brand-cyan   | purple-50/100   -> brand-purple/10
Se dejan a proposito: rojos de error, verdes de exito, ambar de pendiente,
grises, y los colores de categoria del mapa.

## AUTH SWITCH

`client/src/components/ui/auth-switch.tsx`, selector deslizante entre
"Iniciar sesion" y "Crear cuenta". Controlado:
  { value: "login" | "register"; onChange: (v) => void; className?: string }
Export nombrado y default. Indicador que se desliza con translateX, sin medir en JS.
Accesible: role tablist/tab, aria-selected, tabIndex rotativo, flechas del teclado.
Integrado en Login.tsx reusando el prop `goToRegister` que ya existia.
Reemplazo al texto viejo "No tienes cuenta? Registrate".

NOTA sobre los pedidos de componentes del usuario: mando dos veces un snippet
llamado primero "Component" y despues "auth-switch.tsx", pero el contenido era
siempre el mismo contador de ejemplo, un placeholder sin relacion con autenticacion.
Ademas su demo.tsx importaba default y el snippet exportaba nombrado, no compilaban
juntos. El componente se construyo desde cero interpretando el nombre.

## GRAPHIFY: ARREGLADO, YA SE PUEDE USAR

Durante toda la sesion las consultas al grafo devolvian ruido y los agentes tuvieron
que ignorarlo. Causa: indexaba las cinco herramientas clonadas dentro del proyecto
(ponytail, rtk, graphify, i-have-adhd, claude-token-efficient) mas la documentacion
de skills en .agents/.

Arreglo: se creo `.graphifyignore` en la raiz, con sintaxis de gitignore, excluyendo
esas carpetas mas el andamiaje muerto de _core y las salidas de build.

Resultado: de 22.508 nodos y 1.403 archivos a 1.021 nodos y 124 archivos. Solo Pet Nova.
Ya vale la pena usar `graphify query` de nuevo.

Si en el futuro se clonan mas herramientas dentro del proyecto, agregarlas ahi.

## POSTGRES: MIGRADO Y VERIFICADO

server/db.ts ya NO guarda en archivo. Usa un Pool de pg contra Neon.
Las 5 tablas existen en Neon, confirmado con consulta directa:
  users, appointments, vaccines, lost_pet_alerts, anonymous_reports
Los datos que habia en data.json se migraron con INSERT ON CONFLICT DO NOTHING.

PRUEBA CRITICA SUPERADA, verificada por mi, no solo por el agente:
  1. Registre una cuenta nueva y cree una cita -> HTTP 201
  2. Apague el servidor por completo (taskkill)
  3. Lo levante de cero
  4. Login con esa misma cuenta -> HTTP 200
Los datos sobreviven al reinicio. Esto es lo que Vercel necesita.

Tambien verificado: login con clave incorrecta 401, cuenta inexistente 401,
aislamiento entre usuarios intacto tras la migracion.

QUEDA EN JSON, fuera de alcance de la migracion: `posts` (comunidad) y
`trackingRoutes` (simulador de paseo). Si se usan esas pantallas en Vercel, esos
datos SI se pierden. Falta migrarlos.

## MODO OSCURO: FUNCIONA. Habia DOS sistemas peleando

Sintoma: guardabas la preferencia oscura, recargabas, y volvia a claro.

Causa real, encontrada probando en el navegador con sesion real:
  - ThemeContext.tsx usaba la clave "theme" y con switchable=false forzaba claro,
    haciendo classList.remove("dark") en su efecto.
  - El interruptor nuevo del panel usaba otra clave, "petNovaTheme".
  Cada uno pisaba al otro. El ThemeContext ganaba porque su efecto corria despues.

Arreglo: ThemeContext.tsx reescrito como fuente unica de verdad. Usa "petNovaTheme",
respeta la preferencia guardada siempre, cae a prefers-color-scheme si no hay nada,
y un MutationObserver lo mantiene sincronizado con el interruptor del header.

Verificado: preferencia oscura sobrevive la recarga (clase dark presente, tarjeta en
oklch(0.21 0.006 285.885)), y el boton alterna en ambos sentidos guardando la eleccion.

NOTA: el agente habia afirmado que ThemeContext no interferia. Se equivoco. Solo se
detecto probandolo de verdad con una sesion iniciada.

## ANIMACIONES CSS

En client/src/index.css:
  @keyframes fade-in-up  (linea 144) -> .animate-card-in con .stagger-1..4
  @keyframes stat-pulse  (linea 155) -> .animate-stat-pulse
  .hover-lift -> elevacion suave en hover
Bloque @media (prefers-reduced-motion: reduce) en la linea 199 que las desactiva.
Solo animan transform y opacity, nunca width ni height.
8 elementos del panel las usan.

## VERCEL: preparado, falta que el usuario despliegue

Archivos listos: vercel.json, api/index.ts (exporta la app sin listen), DEPLOY.md.
`pnpm run build` pasa limpio.
El deploy en si lo tiene que hacer el usuario: requiere su cuenta de GitHub y Vercel.

PENDIENTE CONOCIDO: las fotos que suben los usuarios van a disco via multer y se
sirven desde disco en server/index.ts. En Vercel DESAPARECEN. La base resuelve los
registros, no las imagenes. Ver DEPLOY.md, hay tres opciones documentadas.

## ESTADO ANTERIOR AL CORTE (ya resuelto arriba)

Se alcanzo el limite de sesion. Varias cosas que el usuario pidio NO se hicieron.
No asumir que estan listas.

### NO HECHO, y el usuario cree que si
- **LA MIGRACION A POSTGRES NO SE HIZO.** El agente murio por limite de sesion antes
  de empezar. Verificado: server/db.ts sigue con readFileSync/writeFileSync y cero
  uso de `pg`. El almacenamiento SIGUE SIENDO EL ARCHIVO server/data.json.
- **NO SE PUBLICO EN VERCEL.** Y no se puede hasta migrar el almacenamiento, porque
  en serverless el disco es efimero. Ademas el deploy requiere la cuenta del usuario.
- **EL MODO OSCURO NO FUNCIONA.** El CSS existe (.dark en index.css:88 y
  @custom-variant dark en la linea 5) pero NINGUNA pagina lo usa: todas tienen
  bg-white, text-gray-900 y gradientes fijos. Hacerlo funcionar es convertir las
  16 paginas a tokens semanticos (bg-background, text-foreground, bg-card).
  Es un refactor grande, no un ajuste.

### SI HECHO en esta ultima tanda
- server/index.ts ahora carga `dotenv/config` como PRIMER import. Antes nadie leia
  el .env, por eso el server avisaba que JWT_SECRET no estaba definido aunque si
  estuviera escrito. Va primero porque auth.ts valida el secreto al importarse.
- Nav: gap-2 -> gap-8 lg:gap-12. Con la expansion a 180px los botones necesitaban aire.
- Header: el avatar ahora muestra la FOTO DE LA MASCOTA, no la inicial del dueno.
  Cae a la inicial solo si no hay foto.

### BASE DE DATOS: lista para usar, sin migrar
- Neon Postgres 18.4 CONECTA. Probado con una consulta real.
- .env escrito con DATABASE_URL y un JWT_SECRET de 64 caracteres.
- `pg` y `@types/pg` instalados.
- Falta: crear tablas y reescribir server/db.ts. El prompt detallado de esa tarea
  esta en el historial, incluye el esquema de las 5 tablas y las 11 pruebas de curl.
- NO usar drizzle: su andamiaje apunta a MySQL y esta muerto.

### IDIOMA: el sitio deberia estar en ingles
Default ya es "en" en LanguageContext. PERO varias paginas tienen ESPANOL FIJO en el
codigo, sin pasar por t(), asi que nunca se traducen:
  Login.tsx, Registration.tsx, Desinformacion.tsx, PetMoments.tsx, DenunciasAnonimas.tsx
Ejemplo: el login muestra "Bienvenido de nuevo" e "Inicia sesion" siempre.
Hay que mover esos textos a LanguageContext con claves en en y es.

### CALIDAD DEL GRAFO DE GRAPHIFY
graphify-out/graph.json indexa TAMBIEN los repos de herramientas clonados en la
carpeta (ponytail, rtk, graphify, i-have-adhd, claude-token-efficient). Eso ensucia
las consultas: un agente reporto que preguntar por este proyecto no devolvia nada util.
Conviene excluir esas carpetas o mover las herramientas fuera del proyecto.

## Pendiente

### PetHero: terminado pero SIN INTEGRAR
`client/src/components/PetHero.tsx` esta completo y compila. Nadie lo usa todavia.

Falta UNA cosa: integrarlo en `Dashboard.tsx` como lo primero que ve el usuario
al entrar, en la vista `pageView === "dashboard"`, arriba de las tarjetas actuales.

Firma para integrar:
```tsx
<PetHero
  petName={userData.petName}
  petPhoto={userData.photo}
  breed={userData.breed}
  age={userData.age}
  species={userData.species}
/>
```

Usa framer-motion 12.23.22 con useScroll, useTransform y useReducedMotion.
Las 4 capas de parallax: fondo 0→10%, foto 0→-16%, titulo 0→-26%, frontal 0→-40%.
Con prefers-reduced-motion los rangos colapsan a 0%, sin saltear hooks.
NO instalar gsap ni lenis.

ESTADO: YA INTEGRADO en Dashboard.tsx, entre `</header>` y `<main>`, a ancho completo.
Verificado en navegador: renderiza el nombre, el hero mide 360px de alto, salen las
stats (raza, edad, especie), sin scroll horizontal, sin errores de consola.

EL PARALLAX FUNCIONA. No hay bug. Esto se investigo a fondo, no lo vuelvas a abrir
sin leer esto primero.

Sintoma que confunde: al medir desde el panel de preview, style.transform de las
4 capas queda en "none" sin importar cuanto scrollees.

Causa real: el panel de preview de este entorno NUNCA compone frames.
document.hidden es true permanentemente y requestAnimationFrame NUNCA dispara.
Verificado dos veces, de forma independiente.
framer-motion depende 100% de rAF para su frameloop, asi que los motion values
quedan congelados en su valor inicial. No es el codigo.

Prueba: bombeando a mano el pipeline de frames de framer sobre el componente vivo,
con scroll en 250 el progreso da 0.469 y las capas dan
  bgY     translateY(4.69%)     rango [0%, 10%]
  photoY  translateY(-7.51%)    rango [0%, -16%]
  titleY  translateY(-12.21%)   rango [0%, -26%]
  frontY  translateY(-18.78%)   rango [0%, -40%]
Exactamente proporcional a lo definido. Las 4 capas se mueven a distinta velocidad.

CONSECUENCIA PARA VERIFICAR EN GENERAL:
En este panel se pueden verificar layout, colores computados, posiciones, presencia
en el DOM y errores de consola. NO se puede verificar nada que dependa de rAF ni
animaciones en movimiento. Para eso hace falta un navegador real.

LIMPIEZA DE DUPLICADOS YA HECHA en Dashboard.tsx:
- Sacada la tarjeta de bienvenida con foto chica. Ahora es solo un saludo de texto.
  La identidad de la mascota la muestra PetHero.
- Sacada la seccion "<nombre>'s Profile" con Breed/Age/Weight. Duplicaba la tarjeta
  de PetHero y ademas estaba hardcodeada en ingles, sin pasar por i18n.
- Iconos de las tarjetas de stats pasados a tokens de marca. Verificado en el DOM:
  rgb(130,104,213), rgb(12,192,223), rgb(226,59,59).
- El icono de To Do quedo en text-amber-500 A PROPOSITO. Es un color semantico de
  pendiente, no de marca. Cuatro tarjetas del mismo tono se leen peor.
- Verificado con una foto real: ahora aparece UNA sola vez, en el hero.
- El documento bajo de 1437px a 1174px de alto.

PENDIENTE MENOR: el peso de la mascota ya no se muestra en el panel, porque estaba
solo en la seccion que se elimino. Si se quiere, agregarlo a la tarjeta de PetHero
junto a raza, edad y especie.

### No asignado
- Pagina Alerta Paw: faltan los dos botones del mockup,
  "Reportar perro perdido" y "Reportar perro visto (encontrado)".
- `Logo.tsx` no se usa en ningun lado todavia. `Dashboard.tsx` y `Login.tsx`
  siguen con `<img src="/pet-nova-logo.svg">`. Falta cambiarlos al componente.
- Las dos pastillas de Desinformacion son `div`, se ven clickeables pero no lo son.
- Idioma por defecto ingles, el mockup es espaniol. Decidir si cambiar el default.

---

## Decisiones tomadas

- **framer-motion en vez de gsap + lenis.** Ya estaba instalado y sin usar. El codigo de
  referencia que paso el usuario dependia de 2 paquetes no instalados, de clases CSS que
  no vinieron con el, y de imagenes de un CDN ajeno.
- **lucide-react en vez de react-icons.** react-icons no esta instalado y no vale
  agregarlo por unos pocos iconos.
- **SVG en vez de PNG para el logo.** SVG ya es transparente y escala sin perder calidad.
  PNG transparente se pixela al agrandarlo.
- **Al nav se le agrega el efecto encima, sin rehacerlo.** La estructura pastilla + lista
  ya fue verificada contra el mockup.

## Correcciones reales que atrapo la revision

- Pet Moments recortaba las polaroids en mobile por `grid-cols-2` fijo dentro de un
  contenedor con `overflow-hidden`. Corregido y verificado a 375px.
- Logo cargado con `<img src>` no se podia recolorear. Pasado a SVG en linea.
- Registration hardcodeo hex en vez de usar tokens. Devuelto a corregir.
- **Yo reporte mal que el dark mode estaba roto.** Dije que `var(--color-blue-500)` era
  una variable indefinida. Es falso: existe en el tema por defecto de Tailwind.
  Lo verifique en `node_modules/tailwindcss/theme.css`. No era un bug.

## Referencias

Mockups extraidos de "pet nova webb.docx", en
`C:\Users\Usuario\Downloads\docx_unpacked\word\media\`:
- `image1.png`: mockup completo del sitio, la fuente de verdad principal
- `image3.jpeg`: inspiracion de layout para Desinformacion (rojo = jornadas, verde = articulos)
- `image4.png`: grid de albumes de Pet Moments
- `image5.png`: album abierto tipo scrapbook
