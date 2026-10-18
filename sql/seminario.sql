-- =====================================================================
-- SEMINARIO NACIONAL DE ACTUALIZACIÓN PEDAGÓGICA EN LSV
-- =====================================================================
-- Guarda las inscripciones del seminario y las diapositivas de los
-- ponentes. Ejecutar UNA vez en el SQL Editor de Supabase.
--
-- Privacidad: cualquiera puede inscribirse (insert), pero solo la
-- sesión de administrador puede leer, corregir o borrar la lista.
-- Las diapositivas viven en un bucket PRIVADO: se suben desde el
-- formulario y solo el administrador las descarga desde el panel.
-- =====================================================================

create table if not exists public.seminario_inscripciones (
  id                uuid primary key default gen_random_uuid(),
  nombres_apellidos text not null,
  documento         text not null,          -- cédula / pasaporte, normalizada
  email             text not null,          -- ahí llega el certificado digital
  telefono          text,
  pais              text,
  ciudad            text,
  condicion         text not null,          -- SORDO / OYENTE / HIPOACUSICA_CODA_OTRA
  perfil            text not null,          -- formación o afiliación comunitaria
  modalidad         text not null,          -- PRESENCIAL / VIRTUAL
  accesibilidad     text not null default 'LSV',  -- LSV / SSI / SUBTITULADO
  rol               text not null default 'ASISTENTE',  -- ASISTENTE / PONENTE
  titulo_ponencia   text,
  eje_tematico      text,
  enlace_video      text,                   -- video resumen en LSV (YouTube, Drive…)
  ruta_diapositivas text,                   -- ruta dentro del bucket privado
  creado_el         timestamptz not null default now()
);

-- Una inscripción por persona, sin importar mayúsculas ni puntos.
create unique index if not exists ux_seminario_documento
  on public.seminario_inscripciones (lower(documento));

alter table public.seminario_inscripciones enable row level security;

drop policy if exists "seminario_insert_publico" on public.seminario_inscripciones;
create policy "seminario_insert_publico"
  on public.seminario_inscripciones for insert
  to anon, authenticated
  with check (true);

drop policy if exists "seminario_select_admin" on public.seminario_inscripciones;
create policy "seminario_select_admin"
  on public.seminario_inscripciones for select
  to authenticated
  using (true);

drop policy if exists "seminario_update_admin" on public.seminario_inscripciones;
create policy "seminario_update_admin"
  on public.seminario_inscripciones for update
  to authenticated
  using (true) with check (true);

drop policy if exists "seminario_delete_admin" on public.seminario_inscripciones;
create policy "seminario_delete_admin"
  on public.seminario_inscripciones for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- BUCKET PRIVADO PARA LAS DIAPOSITIVAS (PDF / PPT / PPTX, máx. 15 MB)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'seminario-ponencias',
  'seminario-ponencias',
  false,
  15728640,
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do nothing;

drop policy if exists "seminario_ponencias_subir" on storage.objects;
create policy "seminario_ponencias_subir"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'seminario-ponencias');

drop policy if exists "seminario_ponencias_leer" on storage.objects;
create policy "seminario_ponencias_leer"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'seminario-ponencias');

drop policy if exists "seminario_ponencias_borrar" on storage.objects;
create policy "seminario_ponencias_borrar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'seminario-ponencias');

-- ---------------------------------------------------------------------
-- COMPROBACIÓN (opcional): listar las inscripciones como administrador
-- ---------------------------------------------------------------------
-- select rol, modalidad, count(*) from public.seminario_inscripciones
--  group by rol, modalidad order by 3 desc;
