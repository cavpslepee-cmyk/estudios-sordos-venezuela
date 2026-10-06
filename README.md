# Estudios Sordos de Venezuela

Sitio web abierto para visibilizar los trabajos de investigación realizados por personas sordas
en la educación universitaria venezolana, y para determinar cuántas personas sordas han egresado.

Sitio creado por el **Dr. Javier Ramírez González**.

---

## Índice

1. [Qué incluye](#qué-incluye)
2. [Ver el sitio en tu computadora](#paso-1-ver-el-sitio-en-tu-computadora)
3. [Crear la base de datos en Supabase](#paso-2-crear-la-base-de-datos-en-supabase)
4. [Crear tu usuario administrador](#paso-3-crear-tu-usuario-administrador)
5. [Conectar el sitio a la base de datos](#paso-4-conectar-el-sitio-a-la-base-de-datos)
6. [Publicar gratis en GitHub Pages](#paso-5-publicar-gratis-en-github-pages)
7. [El dominio gratuito y cómo cambiarlo por uno propio](#sobre-el-dominio)
8. [Cómo se usa el panel de administración](#cómo-se-usa-el-panel-de-administración)
9. [Guion de pruebas recomendado](#guion-de-pruebas-recomendado)
10. [Cómo hacer cambios y volver a publicar](#cómo-hacer-cambios-y-volver-a-publicar)
11. [Seguridad y mantenimiento](#seguridad-y-mantenimiento)
12. [Estructura de carpetas](#estructura-de-carpetas)

---

## Qué incluye

| Página | Qué hace |
|---|---|
| `index.html` | Portada: objetivo del sitio, videos intercambiables, contador público de egresados, investigaciones destacadas y listado de quienes autorizaron aparecer. |
| `noticias.html` | Noticias de la comunidad: texto escrito, imagen o flyer y video incrustado, publicadas por el administrador. |
| `investigaciones.html` | Catálogo completo con buscador y filtro por las 9 categorías. |
| `diccionario.html` | Buscador de la Lengua de Señas Venezolana, con filtro por área y por señas acuñadas recientemente. |
| `censo.html` | Formulario del censo de profesionales sordos egresados, con opción de agregar títulos adicionales. |
| `enviar-trabajo.html` | Pasos para enviar una investigación en PDF a `cavpslepee@gmail.com`. |
| `admin.html` | Panel privado: noticias, investigaciones, videos de portada, diccionario y censo (con exportación a CSV). |

**Funciona sin base de datos.** Mientras `js/config.js` no tenga credenciales, el sitio arranca en
**modo demostración**: muestra datos de ejemplo y guarda los cambios solo en tu navegador. Así puedes
probarlo todo hoy mismo y conectar Supabase cuando quieras.

---

## Paso 1. Ver el sitio en tu computadora

**Opción rápida (sin instalar nada):** abre la carpeta del proyecto en Visual Studio Code,
haz clic derecho sobre `index.html` y elige **Open with Live Server**.
Si no tienes la extensión, instálala: panel de extensiones (`Ctrl+Shift+X`) → busca
`Live Server` (de Ritwick Dey) → **Install**.

**Opción sin extensiones:** doble clic sobre `index.html` para abrirlo en el navegador.
Funciona igual; solo que algunas funciones de almacenamiento del navegador son más restrictivas
al abrir archivos con doble clic.

> Recomendación: usa Live Server. Es la forma que más se parece al sitio ya publicado.

En este punto deberías ver la portada con las fotos, un aviso amarillo de **modo demostración**
y el contador marcando **12** egresados de ejemplo.

---

## Paso 2. Crear la base de datos en Supabase

Supabase tiene un plan gratuito permanente que alcanza de sobra para este proyecto.

1. Entra a <https://supabase.com> y pulsa **Start your project**.
2. Regístrate con tu correo o con tu cuenta de GitHub (recomendado: así ambas cuentas quedan unidas).
3. Pulsa **New project**.
   - **Organization**: la que aparezca por defecto.
   - **Name**: `estudios-sordos-venezuela`
   - **Database Password**: inventa una clave larga y **EstudiosSordosVenezuela123**. No se usa en el sitio, pero la necesitarás si algún día te conectas directamente a la base de datos.
   - **Region**: la más cercana, por ejemplo `South America (São Paulo)` o `US East`.
   - Pulsa **Create new project** y espera uno o dos minutos.
4. Cuando termine, ve al menú lateral → **SQL Editor** → **New query**.
5. Abre en tu computadora el archivo `sql/supabase_schema.sql`, copia **todo** su contenido,
   pégalo en el editor de Supabase y pulsa **Run** (o `Ctrl+Enter`).
6. Debe aparecer **Success. No rows returned**.

Ese archivo crea las seis tablas, las reglas de seguridad, el espacio para los PDF,
las funciones de estadísticas y los datos iniciales (tus tres investigaciones y diez señas de ejemplo).
Puedes volver a ejecutarlo sin miedo: no duplica nada.

**Comprueba que funcionó:** menú lateral → **Table Editor**. Deberías ver
`investigaciones`, `censo_egresados`, `titulos_adicionales`, `videos_portada`,
`diccionario_senias` y `configuracion_sitio`.

### Anota tus dos credenciales

Menú lateral → **Project Settings** (ícono de engranaje) → **API** (en algunos proyectos se llama **Data API**):

- **Project URL**: `https://gscvmupzgfavgtpkmvxp.supabase.co` — cópiala **exacta, sin nada
  al final**: si le agregas `/rest/v1/` u otra ruta, el inicio de sesión del panel fallará con
  el error `Invalid path specified in request URL`.
- **Clave `anon public`**: un texto largo que en proyectos nuevos empieza por `sb_publishable_…`
  (en proyectos antiguos, por `eyJ…`). Es pública por diseño y puede viajar con el sitio;
  la que **nunca** debes publicar es la clave `service_role`.

---

## Paso 3. Crear tu usuario administrador

1. Menú lateral → **Authentication** → pestaña **Users**.
2. Pulsa **Add user** → **Create new user**.
3. Escribe tu correo cavpslepee@gmail.com y una contraseña fuerte EstudiosSordos123.
4. **Muy importante:** marca la casilla **Auto Confirm User**. Si no la marcas, no podrás entrar.
5. Pulsa **Create user**.

Luego, en **Authentication** → **URL Configuration**:

- **Site URL**: la dirección final de tu sitio (por ejemplo `https://tuusuario.github.io/estudios-sordos-venezuela/`). Si aún no la sabes, déjala y vuelve aquí cuando publiques.
- **Redirect URLs**: agrega esa misma dirección.

Esto solo es necesario si algún día usas el botón de «recuperar contraseña».

---

## Paso 4. Conectar el sitio a la base de datos

Abre en Visual Studio Code el archivo **`js/config.js`** y pega tus dos datos:

```js
window.CONFIG = {
  SUPABASE_URL: "https://gscvmupzgfavgtpkmvxp.supabase.co/rest/v1/",
  SUPABASE_ANON_KEY: "sb_publishable_tW-I396GngXVM7lUlYCu3Q_2-6vb12c",
  ...
```

Guarda (`Ctrl+S`) y recarga la página en el navegador.

**Cómo saber que funcionó:** el aviso amarillo de «modo demostración» desaparece, y el contador
de la portada pasa a mostrar los datos reales de la base de datos (al principio **3** investigaciones
y **0** egresados, porque el censo real empieza vacío).

> La clave `anon` es **pública por diseño**: está pensada para verse en el navegador.
> Lo que protege tus datos son las reglas de seguridad (RLS) que ya crea el archivo SQL.
> Nunca uses ni publiques la clave `service_role`: esa sí da control total.

---

## Paso 5. Publicar gratis en GitHub Pages

### 5.1 Crear la cuenta y el repositorio

1. Entra a <https://github.com> y crea tu cuenta si no la tienes.
2. Arriba a la derecha pulsa **+** → **New repository**.
3. **Repository name**: `estudios-sordos-venezuela` (este nombre forma parte de tu dirección web).
4. Déjalo en **Public**. No marques ninguna casilla de inicialización.
5. Pulsa **Create repository**.

### 5.2 Subir los archivos

**Opción A — la más sencilla (por el navegador):**

1. En la página del repositorio recién creado pulsa **uploading an existing file**.
2. Abre la carpeta `W_ESTUDIOSSORDOSVENEZUELA` en tu explorador de archivos.
3. Selecciona **todo su contenido**: `admin.html`, `censo.html`, `css`, `diccionario.html`,
   `enviar-trabajo.html`, `img`, `index.html`, `investigaciones.html`, `js`, `README.md`, `sql`
   y también el archivo `.nojekyll` (está oculto: en el explorador de Windows activa
   **Ver → Mostrar → Elementos ocultos**).
4. Arrástralos a la zona de subida de GitHub.
5. Abajo escribe un mensaje (por ejemplo `Primera versión del sitio`) y pulsa **Commit changes**.

**Opción B — con Git desde Visual Studio Code (mejor para el futuro):**

1. Instala Git desde <https://git-scm.com/download/win>.
2. Abre la carpeta del proyecto en VS Code → **Terminal → New Terminal**.
3. Ejecuta, una línea a la vez, reemplazando `TUUSUARIO` por tu nombre de GitHub:

```bash
git init
git add .
git commit -m "Primera versión del sitio"
git branch -M main
git remote add origin https://github.com/TUUSUARIO/estudios-sordos-venezuela.git
git push -u origin main
```

En la línea de `git remote add origin` sustituye `TUUSUARIO` por tu usuario u organización
de GitHub. Si Git responde `error: remote origin already exists` es porque ese comando ya
se ejecutó antes (por ejemplo, con la URL de ejemplo): no lo repitas, cambia la dirección con
`git remote set-url origin https://github.com/TUUSUARIO/estudios-sordos-venezuela.git`
y compruébalo con `git remote -v`.

### 5.3 Activar GitHub Pages

1. En tu repositorio, ve a **Settings** (Configuración).
2. Menú lateral izquierdo → **Pages**.
3. En **Build and deployment**, sección **Source**, elige **Deploy from a branch**.
4. En **Branch**, selecciona `main` y carpeta `/ (root)`. Pulsa **Save**.
5. Espera uno o dos minutos y recarga esa misma pantalla: arriba aparecerá
   **Your site is live at `https://TUUSUARIO.github.io/estudios-sordos-venezuela/`**.

Esa es tu dirección pública. Ya puedes compartirla.

> El archivo `.nojekyll` es necesario: le dice a GitHub que publique las carpetas tal cual,
> sin procesarlas. Si lo olvidas, algunas rutas podrían no funcionar.

---

## Sobre el dominio

**Gratis:** GitHub Pages te da `https://TUUSUARIO.github.io/estudios-sordos-venezuela/`.
Es permanente, con certificado de seguridad (HTTPS) incluido y sin costo mientras el proyecto
se mantenga dentro de los límites de uso razonable (1 GB de archivos y 100 GB de tráfico al mes,
mucho más de lo que este sitio necesita).

**Consejo:** elige un nombre de usuario de GitHub que quieras conservar, porque forma parte
de la dirección. Si más adelante lo cambias, la dirección web cambia también.

**Dominio propio (opcional, de pago):** si algún día compras por ejemplo
`estudiossordosvenezuela.org` en Namecheap, GoDaddy o Gandi (entre 10 y 15 USD al año),
puedes apuntarlo a GitHub Pages desde **Settings → Pages → Custom domain**.
El sitio no necesita ningún cambio: todas sus rutas son relativas.

**Los PDF:** se guardan en Supabase Storage, no en GitHub. Así no ocupan el espacio del repositorio
y puedes reemplazarlos sin volver a publicar el sitio.

---

## Cómo se usa el panel de administración

Entra a `admin.html` (o al enlace **Administrador** del menú) con el correo y la contraseña
que creaste en el Paso 3.

### Investigaciones
- Llena el formulario: título, autor, año, categoría, universidad y resumen.
- **Subir el PDF del trabajo**: elige el archivo y se guarda en Supabase, generando su enlace público automáticamente.
- **O pega aquí el enlace del PDF**: úsalo si el archivo ya está en otro sitio.
- **Enlace de la publicación original**: para trabajos que ya están en una revista (como los tuyos en cultura-sorda.org o Metrópolis).
- **Estado**: solo lo que esté en **Publicado** aparece en el sitio. Usa *Pendiente* para los que llegaron por correo y aún revisas.
- **Destacado**: los marcados aparecen en la portada.
- En la tabla inferior puedes **Editar**, **Publicar**, **Quitar del sitio** o **Eliminar**.

### Videos de portada
- Pega el enlace tal como lo copias de YouTube (`https://www.youtube.com/watch?v=…`):
  el sitio lo convierte solo al formato incrustable. También acepta Vimeo y archivos `.mp4` directos.
- El **título** es lo que aparece como botón en la portada: por eso puedes tener varios videos
  e ir cambiándolos según el tema que quieras mostrar.
- **Ocultar** saca el video de la portada sin borrarlo de la base de datos.

### Diccionario LSV
- Registra la palabra, sus sinónimos, el área temática y la descripción del movimiento.
- Enlaza un video o una imagen de la seña.
- Marca **Acuñada recientemente** con su fecha: esas señas se destacan en el diccionario público
  y pueden filtrarse por separado.

### Censo de egresados
- Ves el total, el desglose por nivel, por categoría, por estado y las universidades con más egresados.
- La tabla muestra cada registro con sus datos de contacto.
- **Descargar el censo en CSV** genera un archivo que abre directamente en Excel, con todos los campos.
- El contador público de la portada se alimenta solo de esta tabla.

---

## Guion de pruebas recomendado

Haz estas pruebas en orden, antes de compartir la dirección. Anota al lado de cada una si pasó.

### A. Sitio público

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| A1 | Abrir `index.html` | Se ve la portada con la foto, el objetivo, el contador y las investigaciones destacadas. |
| A2 | Mirar el contador grande de la franja superior | Muestra un número (6 investigaciones y tus egresados reales). No muestra `—`. |
| A3 | Pulsar los botones debajo del video | El reproductor cambia de video y el título de arriba se actualiza. |
| A4 | Ir a **Investigaciones** | Aparecen tus seis trabajos: tres con enlaces externos y tres con enlace «Leer el PDF». |
| A5 | Pulsar el filtro **Lingüística** | Quedan solo los dos trabajos de lingüística (la metáfora en la LSV y Refrigeración en señas). El contador de resultados dice «2 resultados». |
| A6 | Pulsar **Todas** | Vuelven a aparecer todas. |
| A7 | Escribir `metáfora` en el buscador | Encuentra el trabajo. |
| A8 | Escribir `zzzz` en el buscador | Mensaje de que no hay resultados, sin romperse. |
| A9 | Pulsar **Leer el PDF** / **Ver la publicación** | Abre el documento en una pestaña nueva. |
| A10 | Ir a **Diccionario LSV** | Se ven las señas en tarjetas, ordenadas alfabéticamente. |
| A11 | Buscar `universidad` | Aparece la seña. |
| A12 | Marcar **Solo señas acuñadas recientemente** | Quedan únicamente las que tienen la insignia naranja. |
| A13 | Ir a **Censo de egresados** | El formulario se ve completo, con los estados de Venezuela en el desplegable. |
| A14 | Ir a **Noticias** | Las noticias aparecen ordenadas de la más reciente a la más antigua; la que tiene imagen muestra su foto y la que tiene video muestra el reproductor. |
| A15 | Mirar el pie de cualquier página | Dice «Este sitio ha recibido N visitas»: la primera vez que abres el sitio en un navegador, N suma 1 y no vuelve a subir por recargar. |

### B. Formulario del censo

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| B1 | Pulsar **Enviar** sin llenar nada | Aparecen en rojo los campos obligatorios y el aviso «Revisa los campos marcados en rojo». No se envía nada. |
| B2 | Escribir un correo mal formado (`ana@`) | Error específico en ese campo. |
| B3 | Poner año de graduación `1800` o `3000` | Error que pide un año entre 1950 y el año actual. |
| B4 | Elegir **Maestría** en categoría de egreso | El campo **Nivel** cambia solo a «Postgrado». |
| B5 | Pulsar **+ Agregar otro título** tres veces | Se agregan tres bloques independientes. |
| B6 | Pulsar **Quitar** en el bloque del medio | Ese bloque desaparece y los restantes se renumeran (1, 2). |
| B7 | Llenar todo correctamente y enviar | Mensaje verde de agradecimiento y el formulario queda limpio. |
| B8 | Volver a la portada | El contador de egresados subió en uno. |
| B9 | Registrar a alguien **sin** marcar la casilla de autorización | Su nombre **no** aparece en el listado público de la portada, pero sí cuenta en las estadísticas. |
| B10 | Registrar a alguien **marcando** la casilla | Su nombre y título sí aparecen en la tabla de la portada. |
| B11 | Registrar a alguien con **2 títulos adicionales** y volver a la portada | «Títulos universitarios en total» sube en 3 (1 persona, 3 títulos); el desglose por categoría cuenta cada título (TSU, Licenciado, Especialización, Maestría, Doctorado) y en la tabla pública su fila muestra «También: …» con los títulos extra. |

### C. Panel de administración

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| C1 | Abrir `admin.html` sin sesión | Se ve solo la caja de acceso. |
| C2 | Entrar con una contraseña equivocada | Mensaje de error, no entra. |
| C3 | Entrar con tus datos correctos | Aparece el panel con las cuatro pestañas y la barra superior con tu correo. |
| C4 | Moverte entre pestañas con las flechas del teclado | Cambian correctamente. |
| C5 | Crear una investigación en estado **Pendiente** | Se guarda, aparece en la tabla del panel, pero **no** aparece en `investigaciones.html`. |
| C6 | Pulsar **Publicar** en esa fila | Ya aparece en el sitio público. |
| C7 | Pulsar **Quitar del sitio** | Desaparece del sitio público pero sigue en el panel. |
| C8 | Pulsar **Editar**, cambiar el año y guardar | El formulario se llenó con los datos existentes y el cambio se reflejó en la tabla. |
| C9 | Subir un PDF real en el campo de archivo | Tras unos segundos aparece el enlace generado. **Esta prueba solo funciona con Supabase conectado.** |
| C10 | Crear un video con un enlace de YouTube | Aparece en la portada y se reproduce. |
| C11 | Pulsar **Ocultar** en ese video | Desaparece de la portada sin borrarse. |
| C12 | Crear una seña marcada como **acuñada recientemente** | Aparece en el diccionario público con la insignia naranja y su fecha. |
| C13 | Ir a la pestaña **Censo** | Se ven los totales, los desgloses y la tabla de personas registradas. |
| C14 | Pulsar **Títulos adicionales** en una fila | Lista los títulos extra de esa persona. |
| C15 | Pulsar **Descargar el censo en CSV** | Se baja el archivo y Excel lo abre con acentos correctos. |
| C16 | Pulsar **Eliminar** en un registro | Pide confirmación y, al aceptar, baja el contador de la portada. |
| C17 | Pulsar **Cerrar sesión** | Vuelve a la caja de acceso. |
| C18 | Abrir `admin.html` en una ventana de incógnito | Pide acceso: no queda sesión abierta para otros. |
| C19 | En la pestaña **Noticias**, publicar una con texto, imagen y enlace de YouTube | Aparece en el listado con «imagen y video», y se ve en `noticias.html` y en el bloque «Últimas noticias» de la portada. |

### D. En el teléfono

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| D1 | Abrir el sitio en un celular | El menú se convierte en **☰ Menú** y al pulsarlo se despliegan las opciones. |
| D2 | Probar el formulario del censo | Los campos se apilan en una columna y se pueden llenar sin hacer zoom forzado. |
| D3 | Pulsar **A+ Texto grande** | Todo el texto crece y la preferencia se mantiene al cambiar de página. |

---

## Cómo hacer cambios y volver a publicar

**Textos y fotos:** edítalos en Visual Studio Code y guarda.

- Si subiste los archivos **por el navegador**: arrastra de nuevo el archivo modificado a
  **Add file → Upload files** y confirma. GitHub reemplaza la versión anterior.
- Si usaste **Git**:

```bash
git add .
git commit -m "Actualizo la portada"
git push
```

**Contenido (investigaciones, videos, señas):** no toques código. Usa el panel de administración:
los cambios se guardan en Supabase y aparecen en el sitio al instante.

**Espera uno o dos minutos** después de publicar y recarga con `Ctrl+F5` para saltarte la caché
del navegador.

### Cambiar las fotos

Reemplaza los archivos de la carpeta `img/` conservando exactamente los mismos nombres
(`portada-universidad-lsv.jpg`, `profesionales-sordos.jpg` y `logo-estudios-sordos.jpg`)
y no hace falta tocar nada más. La primera es el fondo del encabezado de la portada, la
segunda es la figura de la sección del censo y la tercera es el logo de la cabecera y del
favicon. Si prefieres usar otras tuyas, cambia el nombre en `index.html` (las dos primeras)
o en las seis páginas `.html` (el logo y el favicon).

### Cambiar los textos fijos

- El objetivo del sitio y la descripción de las secciones están en cada archivo `.html`.
- El correo de recepción está en `js/config.js` (`CORREO_RECEPCION`) y escrito también en
  `enviar-trabajo.html` y en el pie de página de todas las páginas.
- Las categorías y los estados de Venezuela están en `js/config.js`. Si cambias las categorías,
  debes cambiarlas también en el archivo SQL (son un tipo enumerado de la base de datos).

---

## Seguridad y mantenimiento

- **Reglas de seguridad (RLS).** El archivo SQL las deja activadas. En resumen: cualquiera puede
  *leer* las investigaciones publicadas, el diccionario y los videos activos; cualquiera puede
  *enviar* su registro al censo; pero **solo un usuario autenticado** puede leer los datos de
  contacto del censo, y solo él puede crear, editar o borrar contenido.
- **Los datos personales del censo no se publican.** El contador de la portada se calcula con una
  función especial en la base de datos que devuelve únicamente totales, nunca nombres ni correos.
  El listado público de egresados solo incluye a quienes marcaron la casilla de autorización.
- **Contador de visitas.** Cada navegador se cuenta una sola vez, la primera vez que entra al sitio
  (el panel privado no cuenta). El pie de página muestra únicamente el total, calculado por una
  función de la base de datos; el detalle de páginas visitadas solo lo ve el administrador.
- **Haz copias del censo.** Usa el botón **Descargar el censo en CSV** una vez al mes y guarda el
  archivo en tu computadora. También puedes activar copias automáticas en Supabase →
  **Database → Backups**.
- **Respalda el proyecto.** Supabase permite descargar toda la base de datos desde
  **Database → Backups → Download**. Los PDF están en **Storage → investigaciones**.
- **Plan gratuito de Supabase.** Pausa el proyecto si está inactivo durante una semana seguida.
  Como este sitio recibe visitas, en la práctica no debería pausarse; si alguna vez ves que los
  datos no cargan, entra al panel de Supabase y pulsa **Restore**.
- **Si pierdes la contraseña del administrador:** Supabase → **Authentication → Users** →
  tu usuario → **Send password recovery**.

---

## Estructura de carpetas

```
W_ESTUDIOSSORDOSVENEZUELA/
├── index.html                  Portada
├── noticias.html               Noticias de la comunidad (texto, imagen o flyer y video)
├── investigaciones.html        Catálogo público por categorías
├── diccionario.html            Buscador de la Lengua de Señas Venezolana
├── censo.html                  Formulario del censo de egresados
├── enviar-trabajo.html         Pasos para enviar una investigación
├── admin.html                  Panel privado del administrador
├── .nojekyll                   Necesario para que GitHub Pages publique todo
├── README.md                   Esta guía
├── css/
│   └── estilos.css             Todo el diseño del sitio
├── img/
│   ├── logo-estudios-sordos.jpg    Logo de la cabecera y favicon
│   ├── portada-universidad-lsv.jpg Fondo del encabezado de la portada
│   ├── profesionales-sordos.jpg    Figura de la sección del censo
│   └── (seis fotos más)            Galería «La comunidad en imágenes» de la portada
├── pdf/
│   └── (tres PDF)                  Trabajos de grado publicados con enlace «Leer el PDF»
├── js/
│   ├── config.js               ← ÚNICO ARCHIVO QUE DEBES EDITAR (credenciales)
│   ├── db.js                   Capa de acceso a datos (Supabase o modo demo)
│   ├── datos-demo.js           Datos de ejemplo del modo demostración
│   ├── sitio.js                Utilidades, contador de egresados y videos
│   ├── inicio.js               Lógica de la portada
│   ├── noticias.js             Lógica de la página de noticias
│   ├── investigaciones.js      Lógica del catálogo
│   ├── censo.js                Lógica del formulario del censo
│   ├── diccionario.js          Lógica del buscador de señas
│   └── admin.js                Lógica del panel
└── sql/
    └── supabase_schema.sql     Esquema completo de la base de datos
```

---

## Tablas de la base de datos

| Tabla | Contenido |
|---|---|
| `investigaciones` | Trabajos publicados, con categoría, estado y enlaces. |
| `censo_egresados` | Registros del censo de profesionales sordos. |
| `titulos_adicionales` | Títulos extra de cada persona del censo. |
| `videos_portada` | Videos intercambiables de la página principal. |
| `diccionario_senias` | Señas de la LSV, incluidas las acuñadas recientemente. |
| `configuracion_sitio` | Textos editables (correo, autoría, objetivo). |

---

## Categorías de investigación

Educación · Lingüística · Deporte · Social · Cultural · Comunitaria · Política · Arte ·
Biografía de personas sordas destacadas

## Contacto

Recepción de trabajos de investigación en PDF: **cavpslepee@gmail.com**
