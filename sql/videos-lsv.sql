-- =====================================================================
-- VIDEOS EN LSV DEL SEMINARIO
-- =====================================================================
-- Información accesible en Lengua de Señas Venezolana publicada por el
-- administrador (avisos, anuncios y orientación del seminario), visible
-- en la página seminario.html. Ejecutar UNA vez en el SQL Editor.
--
-- Cada video es un enlace (YouTube / Vimeo / .mp4 directo) o un archivo
-- subido al bucket público "noticias" (misma ruta que los videos de las
-- noticias: en la URL se guarda la dirección pública).
-- =====================================================================

create table if not exists public.videos_lsv (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  url         text not null,
  activo      boolean not null default true,
  orden       integer not null default 0,
  creado_el   timestamptz not null default now()
);

alter table public.videos_lsv enable row level security;

drop policy if exists "videos_lsv_select_publico" on public.videos_lsv;
create policy "videos_lsv_select_publico"
  on public.videos_lsv for select
  to anon, authenticated
  using (true);

drop policy if exists "videos_lsv_insert_admin" on public.videos_lsv;
create policy "videos_lsv_insert_admin"
  on public.videos_lsv for insert
  to authenticated
  with check (true);

drop policy if exists "videos_lsv_update_admin" on public.videos_lsv;
create policy "videos_lsv_update_admin"
  on public.videos_lsv for update
  to authenticated
  using (true) with check (true);

drop policy if exists "videos_lsv_delete_admin" on public.videos_lsv;
create policy "videos_lsv_delete_admin"
  on public.videos_lsv for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- COMPROBACIÓN (opcional): ver los videos publicados
-- ---------------------------------------------------------------------
-- select titulo, url, activo, orden from public.videos_lsv order by orden;
