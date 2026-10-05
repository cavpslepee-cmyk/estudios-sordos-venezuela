-- =====================================================================
-- ESTUDIOS SORDOS DE VENEZUELA
-- Esquema de base de datos para Supabase
-- =====================================================================
-- CÓMO USARLO:
--   1. Entra a https://supabase.com y abre tu proyecto.
--   2. Menú lateral -> "SQL Editor" -> "New query".
--   3. Pega TODO este archivo y presiona "Run".
--   4. Puedes ejecutarlo varias veces: es idempotente (no duplica nada).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- TIPOS ENUMERADOS
-- ---------------------------------------------------------------------
do $$ begin
  create type categoria_investigacion as enum (
    'EDUCACION', 'LINGUISTICA', 'DEPORTE', 'SOCIAL', 'CULTURAL',
    'COMUNITARIA', 'POLITICA', 'ARTE', 'BIOGRAFIA'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_investigacion as enum (
    'PENDIENTE', 'APROBADO', 'PUBLICADO', 'RECHAZADO'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type categoria_egreso as enum (
    'TSU', 'LICENCIADO', 'ESPECIALIZACION', 'MAESTRIA', 'DOCTORADO'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type nivel_formacion as enum ('PREGRADO', 'POSTGRADO');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- TABLA: investigaciones
-- ---------------------------------------------------------------------
create table if not exists public.investigaciones (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  autor          text not null,
  anio           integer,
  categoria      categoria_investigacion not null default 'EDUCACION',
  resumen        text,
  universidad    text,
  url_pdf        text,
  url_externa    text,
  estado         estado_investigacion not null default 'PENDIENTE',
  destacado      boolean not null default false,
  orden          integer not null default 0,
  creado_el      timestamptz not null default now(),
  actualizado_el timestamptz not null default now()
);

create index if not exists idx_investigaciones_categoria on public.investigaciones (categoria);
create index if not exists idx_investigaciones_estado    on public.investigaciones (estado);

-- ---------------------------------------------------------------------
-- TABLA: censo_egresados
-- ---------------------------------------------------------------------
create table if not exists public.censo_egresados (
  id                         uuid primary key default gen_random_uuid(),
  nombres                    text not null,
  apellidos                  text not null,
  cedula                     text,
  universidad                text not null,
  carrera                    text,
  titulo_egreso              text not null,
  categoria_egreso           categoria_egreso not null,
  nivel                      nivel_formacion not null,
  anio_graduacion            integer not null,
  estado                     text not null,
  anios_experiencia          integer not null default 0,
  telefono                   text,
  email                      text,
  ha_realizado_investigacion boolean not null default false,
  autoriza_publicar_nombre   boolean not null default false,
  comentarios                text,
  creado_el                  timestamptz not null default now()
);

create index if not exists idx_censo_estado on public.censo_egresados (estado);

-- ---------------------------------------------------------------------
-- TABLA: titulos_adicionales (uno por cada título extra del egresado)
-- ---------------------------------------------------------------------
create table if not exists public.titulos_adicionales (
  id               uuid primary key default gen_random_uuid(),
  censo_id         uuid not null references public.censo_egresados (id) on delete cascade,
  titulo           text not null,
  universidad      text,
  anio_graduacion  integer,
  categoria_egreso categoria_egreso,
  nivel            nivel_formacion
);

create index if not exists idx_titulos_censo on public.titulos_adicionales (censo_id);

-- ---------------------------------------------------------------------
-- TABLA: videos_portada
-- ---------------------------------------------------------------------
create table if not exists public.videos_portada (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  url         text not null,
  activo      boolean not null default true,
  orden       integer not null default 0,
  creado_el   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- TABLA: diccionario_senias
-- ---------------------------------------------------------------------
create table if not exists public.diccionario_senias (
  id                     uuid primary key default gen_random_uuid(),
  palabra                text not null,
  sinonimos              text,
  categoria              text not null default 'GENERAL',
  descripcion            text,
  url_video              text,
  url_imagen             text,
  acuniada_recientemente boolean not null default false,
  fecha_acuniada         date,
  fuente                 text,
  creado_el              timestamptz not null default now()
);

create index if not exists idx_senias_palabra on public.diccionario_senias (lower(palabra));

-- ---------------------------------------------------------------------
-- TABLA: configuracion_sitio (textos editables por el administrador)
-- ---------------------------------------------------------------------
create table if not exists public.configuracion_sitio (
  clave      text primary key,
  valor      text,
  actualizado_el timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ACTUALIZACIÓN AUTOMÁTICA DE actualizado_el
-- ---------------------------------------------------------------------
create or replace function public.touch_actualizado_el()
returns trigger language plpgsql as $$
begin
  new.actualizado_el := now();
  return new;
end $$;

drop trigger if exists trg_investigaciones_touch on public.investigaciones;
create trigger trg_investigaciones_touch
  before update on public.investigaciones
  for each row execute function public.touch_actualizado_el();

-- ---------------------------------------------------------------------
-- FUNCIONES PÚBLICAS DE ESTADÍSTICAS
-- SECURITY DEFINER permite contar egresados SIN exponer los datos
-- personales de la tabla censo_egresados al público.
-- ---------------------------------------------------------------------
create or replace function public.resumen_censo()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'total_egresados', (select count(*) from censo_egresados),
    'con_investigacion', (select count(*) from censo_egresados where ha_realizado_investigacion),
    'por_nivel', (
      select coalesce(jsonb_object_agg(nivel, c), '{}'::jsonb)
      from (select nivel, count(*) c from censo_egresados group by nivel) s
    ),
    'por_categoria', (
      select coalesce(jsonb_object_agg(categoria_egreso, c), '{}'::jsonb)
      from (select categoria_egreso, count(*) c from censo_egresados group by categoria_egreso) s
    ),
    'por_estado', (
      select coalesce(jsonb_object_agg(estado, c), '{}'::jsonb)
      from (select estado, count(*) c from censo_egresados group by estado) s
    ),
    'por_universidad', (
      select coalesce(jsonb_object_agg(universidad, c), '{}'::jsonb)
      from (
        select universidad, count(*) c from censo_egresados
        group by universidad order by count(*) desc limit 10
      ) s
    )
  );
$$;

create or replace function public.nombres_publicos_egresados()
returns table (nombres text, apellidos text, titulo_egreso text, universidad text, estado text, anio_graduacion integer)
language sql
security definer
set search_path = public
stable
as $$
  select nombres, apellidos, titulo_egreso, universidad, estado, anio_graduacion
  from censo_egresados
  where autoriza_publicar_nombre = true
  order by apellidos, nombres;
$$;

revoke all on function public.resumen_censo() from public;
revoke all on function public.nombres_publicos_egresados() from public;
grant execute on function public.resumen_censo() to anon, authenticated;
grant execute on function public.nombres_publicos_egresados() to anon, authenticated;

-- ---------------------------------------------------------------------
-- SEGURIDAD (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.investigaciones       enable row level security;
alter table public.censo_egresados       enable row level security;
alter table public.titulos_adicionales   enable row level security;
alter table public.videos_portada        enable row level security;
alter table public.diccionario_senias    enable row level security;
alter table public.configuracion_sitio   enable row level security;

-- INVESTIGACIONES: el público solo ve lo PUBLICADO; el admin ve y edita todo.
drop policy if exists "investigaciones_lectura_publica" on public.investigaciones;
create policy "investigaciones_lectura_publica"
  on public.investigaciones for select to anon, authenticated
  using (estado = 'PUBLICADO' or auth.role() = 'authenticated');

drop policy if exists "investigaciones_admin_total" on public.investigaciones;
create policy "investigaciones_admin_total"
  on public.investigaciones for all to authenticated
  using (true) with check (true);

-- CENSO: cualquiera puede registrarse; solo el admin lee los datos.
drop policy if exists "censo_insert_publico" on public.censo_egresados;
create policy "censo_insert_publico"
  on public.censo_egresados for insert to anon, authenticated
  with check (true);

drop policy if exists "censo_lectura_admin" on public.censo_egresados;
create policy "censo_lectura_admin"
  on public.censo_egresados for select to authenticated using (true);

drop policy if exists "censo_admin_total" on public.censo_egresados;
create policy "censo_admin_total"
  on public.censo_egresados for all to authenticated
  using (true) with check (true);

-- TÍTULOS ADICIONALES
drop policy if exists "titulos_insert_publico" on public.titulos_adicionales;
create policy "titulos_insert_publico"
  on public.titulos_adicionales for insert to anon, authenticated
  with check (true);

drop policy if exists "titulos_admin_total" on public.titulos_adicionales;
create policy "titulos_admin_total"
  on public.titulos_adicionales for all to authenticated
  using (true) with check (true);

-- VIDEOS: el público ve los activos.
drop policy if exists "videos_lectura_publica" on public.videos_portada;
create policy "videos_lectura_publica"
  on public.videos_portada for select to anon, authenticated
  using (activo = true or auth.role() = 'authenticated');

drop policy if exists "videos_admin_total" on public.videos_portada;
create policy "videos_admin_total"
  on public.videos_portada for all to authenticated
  using (true) with check (true);

-- DICCIONARIO: lectura pública total, escritura solo admin.
drop policy if exists "senias_lectura_publica" on public.diccionario_senias;
create policy "senias_lectura_publica"
  on public.diccionario_senias for select to anon, authenticated using (true);

drop policy if exists "senias_admin_total" on public.diccionario_senias;
create policy "senias_admin_total"
  on public.diccionario_senias for all to authenticated
  using (true) with check (true);

-- CONFIGURACIÓN: lectura pública, escritura admin.
drop policy if exists "config_lectura_publica" on public.configuracion_sitio;
create policy "config_lectura_publica"
  on public.configuracion_sitio for select to anon, authenticated using (true);

drop policy if exists "config_admin_total" on public.configuracion_sitio;
create policy "config_admin_total"
  on public.configuracion_sitio for all to authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------
-- BUCKET DE ARCHIVOS PDF
-- (También puedes crearlo en Dashboard -> Storage -> New bucket)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('investigaciones', 'investigaciones', true)
on conflict (id) do nothing;

drop policy if exists "pdf_lectura_publica" on storage.objects;
create policy "pdf_lectura_publica"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'investigaciones');

drop policy if exists "pdf_subida_admin" on storage.objects;
create policy "pdf_subida_admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'investigaciones');

drop policy if exists "pdf_borrado_admin" on storage.objects;
create policy "pdf_borrado_admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'investigaciones');

-- ---------------------------------------------------------------------
-- DATOS INICIALES
-- ---------------------------------------------------------------------

-- Los trabajos de investigación publicados al estrenar el sitio:
-- los tres del Dr. Javier Ramírez González y los tres trabajos de grado que tutoró.
-- Se insertan solo si la tabla está vacía (así puedes reejecutar el archivo).
insert into public.investigaciones
  (titulo, autor, anio, categoria, resumen, universidad, url_pdf, url_externa, estado, destacado, orden)
select titulo, autor, anio, categoria::categoria_investigacion, resumen, universidad,
       url_pdf, url_externa, estado::estado_investigacion, destacado, orden
from (values
  (
    'Integración de estudiantes sordos a la educación universitaria',
    'Dr. Javier Ramírez González',
    2020,
    'EDUCACION',
    'Análisis de las barreras de acceso y permanencia que enfrentan los estudiantes sordos en la educación universitaria, y de las condiciones institucionales, lingüísticas y pedagógicas necesarias para lograr una integración real.',
    null::text,
    null::text,
    'https://www.cultura-sorda.org/integracion-de-estudiantes-sordos-a-la-educacion-universitaria/',
    'PUBLICADO', true, 1
  ),
  (
    'Aproximación a la metáfora en la Lengua de Señas Venezolana',
    'Dr. Javier Ramírez González',
    2020,
    'LINGUISTICA',
    'Estudio lingüístico sobre los mecanismos metafóricos presentes en la Lengua de Señas Venezolana (LSV), con análisis de corpus y su aporte a la descripción gramatical de la lengua.',
    null::text,
    null::text,
    'https://www.cultura-sorda.org/wp-content/uploads/2026/03/Ramirez2020_APROXIMACION_METAFORA_LSV.pdf',
    'PUBLICADO', true, 2
  ),
  (
    'Publicación en Revista Metrópolis',
    'Dr. Javier Ramírez González',
    null::integer,
    'EDUCACION',
    'Trabajo de investigación publicado en la Revista Metrópolis de la Universidad Metropolitana.',
    'Universidad Metropolitana',
    null::text,
    'https://metropolis.metrouni.us/index.php/metropolis/article/view/99',
    'PUBLICADO', true, 3
  ),
  (
    'La caverna y la luz: narrativas pedagógicas con sordociegos y sordos desde la Lengua de Señas Venezolana',
    'Poema Rondón',
    2025,
    'EDUCACION',
    'Trabajo final de grado de la Licenciatura en Pedagogía Alternativa (subárea Cultura Sorda): narrativas pedagógicas con personas sordociegas y sordas construidas desde la Lengua de Señas Venezolana. Tutor académico: Dr. Javier Ramírez.',
    null::text,
    'pdf/la-caverna-y-la-luz-poema-rondon.pdf',
    null::text,
    'PUBLICADO', false, 4
  ),
  (
    'Refrigeración en señas: una aproximación técnica, lingüística y antropológica desde la perspectiva sorda',
    'Eliscson Reverón',
    2025,
    'LINGUISTICA',
    'Trabajo de grado de la Licenciatura en Desarrollo Endógeno (subárea Refrigeración): el vocabulario técnico de la refrigeración en lengua de señas, abordado desde lo técnico, lo lingüístico y lo antropológico por un autor sordo. Tutor académico: Javier Ramírez.',
    'Universidad Nacional Experimental Simón Rodríguez',
    'pdf/refrigeracion-en-senas-eliscson-reveron.pdf',
    null::text,
    'PUBLICADO', false, 5
  ),
  (
    'Lo que mis manos cuentan: pedagogía, identidad y resistencia desde la lengua de señas',
    'Glenda Maginan',
    2025,
    'EDUCACION',
    'Trabajo final de grado de la Licenciatura en Pedagogía Alternativa en Comunicación y Lengua de Señas Venezolana: pedagogía, identidad y resistencia de la persona sorda contadas desde su propia lengua. Tutor académico: Javier Ramírez.',
    null::text,
    'pdf/lo-que-mis-manos-cuentan-glenda-maginan.pdf',
    null::text,
    'PUBLICADO', false, 6
  )
) as v(titulo, autor, anio, categoria, resumen, universidad, url_pdf, url_externa, estado, destacado, orden)
where not exists (select 1 from public.investigaciones);

-- Video de portada de ejemplo
insert into public.videos_portada (titulo, descripcion, url, activo, orden)
select
  'Bienvenidos a Estudios Sordos de Venezuela',
  'Video de presentación del proyecto. El administrador puede cambiarlo desde el panel.',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  true, 1
where not exists (select 1 from public.videos_portada);

-- Configuración inicial del sitio
insert into public.configuracion_sitio (clave, valor) values
  ('correo_recepcion', 'cavpslepee@gmail.com'),
  ('autor_sitio', 'Dr. Javier Ramírez González'),
  ('texto_objetivo', 'Visibilizar los trabajos realizados por personas sordas a nivel de educación universitaria y determinar la cantidad de egresados en la actualidad.')
on conflict (clave) do nothing;

-- 10 señas LSV de ejemplo (reemplázalas por las oficiales en el panel admin)
insert into public.diccionario_senias
  (palabra, sinonimos, categoria, descripcion, acuniada_recientemente, fuente)
select * from (values
  ('UNIVERSIDAD', 'CASA DE ESTUDIOS SUPERIORES', 'EDUCACION',
   'Se coloca la mano dominante en forma de "U" sobre la frente y se desplaza hacia adelante y arriba, evocando el birrete académico.',
   false, 'Datos de ejemplo'),
  ('INVESTIGACION', 'INVESTIGAR', 'EDUCACION',
   'Ambos índices se mueven en círculos pequeños frente a los ojos, representando la búsqueda detallada de información.',
   false, 'Datos de ejemplo'),
  ('LENGUA_DE_SENAS', 'LSV, IDIOMA DE SENAS', 'LINGUISTICA',
   'Las manos abiertas se alternan moviéndose hacia arriba desde la boca, simulando el flujo continuo de la comunicación visual.',
   false, 'Datos de ejemplo'),
  ('SORDO', 'PERSONA SORDA', 'IDENTIDAD',
   'La mano en forma de "S" o índice extendido gira desde la comisura de la boca hacia la oreja.',
   false, 'Datos de ejemplo'),
  ('OYENTE', 'PERSONA OYENTE', 'IDENTIDAD',
   'El índice se coloca sobre la oreja y da un pequeño toque, señalando la audición.',
   false, 'Datos de ejemplo'),
  ('GRADUACION', 'GRADO, EGRESO', 'EDUCACION',
   'La mano plana simula el birrete sobre la cabeza y se levanta ligeramente, acompañada de expresión de logro.',
   false, 'Datos de ejemplo'),
  ('TESIS', 'TRABAJO DE GRADO', 'EDUCACION',
   'Se sostiene una mano como si fuera un documento y la otra golpea suavemente el dorso, indicando el trabajo escrito final.',
   false, 'Datos de ejemplo'),
  ('ACCESIBILIDAD', 'ACCESO, INCLUSION', 'SOCIAL',
   'Las manos entrelazadas se abren hacia el frente, representando la eliminación de barreras.',
   true, 'Seña acuñada recientemente - datos de ejemplo'),
  ('INTERPRETE', 'INTERPRETE DE LSV', 'PROFESIONES',
   'Los índices de ambas manos giran uno alrededor del otro, mostrando el traslado del mensaje entre dos lenguas.',
   false, 'Datos de ejemplo'),
  ('COMUNIDAD_SORDA', 'PUEBLO SORDO', 'COMUNITARIA',
   'Ambas manos en "S" se mueven en círculo frente al pecho, expresando el colectivo y la identidad compartida.',
   true, 'Seña acuñada recientemente - datos de ejemplo')
) as v(palabra, sinonimos, categoria, descripcion, acuniada_recientemente, fuente)
where not exists (select 1 from public.diccionario_senias);

-- ---------------------------------------------------------------------
-- FIN. Verifica en el Dashboard -> Table Editor que aparezcan:
--   investigaciones, censo_egresados, titulos_adicionales,
--   videos_portada, diccionario_senias, configuracion_sitio
-- ---------------------------------------------------------------------
