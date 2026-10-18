-- =====================================================================
-- UNIFICACIÓN DE NOMBRES DE UNIVERSIDADES DEL CENSO (2026-10-18)
-- Ejecutar una sola vez en Supabase → SQL Editor.
-- Junta las variantes (tipeo, acentos, mayúsculas, siglas) bajo el
-- nombre canónico que ya existe en la base. Cubre censo_egresados y
-- titulos_adicionales. La coincidencia ignora mayúsculas y espacios
-- repetidos.
-- =====================================================================

create temp table mapa_universidades (variante text primary key, canonica text not null) on commit drop;

insert into mapa_universidades (variante, canonica) values
  -- UNESR
  ('simon rodríguez', 'UNIVERSIDAD NACIONAL EXPERIMENTAL SIMÓN RODRÍGUEZ (UNESR)'),
  ('simón rodríguez', 'UNIVERSIDAD NACIONAL EXPERIMENTAL SIMÓN RODRÍGUEZ (UNESR)'),
  ('unesr', 'UNIVERSIDAD NACIONAL EXPERIMENTAL SIMÓN RODRÍGUEZ (UNESR)'),
  ('universidad nacional expeimental simon rodriguez', 'UNIVERSIDAD NACIONAL EXPERIMENTAL SIMÓN RODRÍGUEZ (UNESR)'),
  ('universidad experimental simón rodríguez', 'UNIVERSIDAD NACIONAL EXPERIMENTAL SIMÓN RODRÍGUEZ (UNESR)'),
  ('universidad nacional experimental simón rodriguez', 'UNIVERSIDAD NACIONAL EXPERIMENTAL SIMÓN RODRÍGUEZ (UNESR)'),
  ('universidad nacional experimental simón rodríguez', 'UNIVERSIDAD NACIONAL EXPERIMENTAL SIMÓN RODRÍGUEZ (UNESR)'),
  ('universidad nacional experimiental simon rodríguez', 'UNIVERSIDAD NACIONAL EXPERIMENTAL SIMÓN RODRÍGUEZ (UNESR)'),
  ('universidad nacional exprimiental simon rodriguez', 'UNIVERSIDAD NACIONAL EXPERIMENTAL SIMÓN RODRÍGUEZ (UNESR)'),
  ('universidad nacional exprimiental simon rodríguez', 'UNIVERSIDAD NACIONAL EXPERIMENTAL SIMÓN RODRÍGUEZ (UNESR)'),
  ('universidad simon rodriguez', 'UNIVERSIDAD NACIONAL EXPERIMENTAL SIMÓN RODRÍGUEZ (UNESR)'),
  -- UNELLEZ (incluye la sede Barinas)
  ('unellez', 'UNIVERSIDAD NACIONAL EXPERIMENTAL DE LOS LLANOS OCCIDENTALES EZEQUIEL ZAMORA (UNELLEZ)'),
  ('unellez universidad nacional experimental de los llanos occidentales ezequiel', 'UNIVERSIDAD NACIONAL EXPERIMENTAL DE LOS LLANOS OCCIDENTALES EZEQUIEL ZAMORA (UNELLEZ)'),
  ('unellez universidad nacional experimental de los llanos occidentales ezequiel zamora', 'UNIVERSIDAD NACIONAL EXPERIMENTAL DE LOS LLANOS OCCIDENTALES EZEQUIEL ZAMORA (UNELLEZ)'),
  ('universidad nacional experimental de los llanos occidentales ezequiel zamora (unellez)-barinas', 'UNIVERSIDAD NACIONAL EXPERIMENTAL DE LOS LLANOS OCCIDENTALES EZEQUIEL ZAMORA (UNELLEZ)'),
  -- UBV
  ('universidad bolivariana de venezuela', 'UNIVERSIDAD BOLIVARIANA DE VENEZUELA (UBV)'),
  -- UCV
  ('universidad central de venezuela', 'UNIVERSIDAD CENTRAL DE VENEZUELA (UCV)'),
  ('universidad central venezuela', 'UNIVERSIDAD CENTRAL DE VENEZUELA (UCV)'),
  -- Carabobo
  ('universidad de carabobo', 'UNIVERSIDAD DE CARABOBO (UC)'),
  -- ULA
  ('universidad de los andes', 'UNIVERSIDAD DE LOS ANDES (ULA)'),
  -- LUZ
  ('universidad del zulia', 'UNIVERSIDAD DEL ZULIA (LUZ)'),
  -- UNA
  ('universidad nacional abierta', 'Universidad Nacional Abierta (UNA)'),
  -- UPEL (los institutos/campus con nombre propio se conservan aparte)
  ('universidad pedagogica experimental libertador', 'UNIVERSIDAD PEDAGÓGICA EXPERIMENTAL LIBERTADOR (UPEL)'),
  ('universidad pedagógica experimental libertador', 'UNIVERSIDAD PEDAGÓGICA EXPERIMENTAL LIBERTADOR (UPEL)'),
  ('universidad pedagogica experimental libertador (upel)', 'UNIVERSIDAD PEDAGÓGICA EXPERIMENTAL LIBERTADOR (UPEL)'),
  ('universidad pedagógica experimental libertador upel', 'UNIVERSIDAD PEDAGÓGICA EXPERIMENTAL LIBERTADOR (UPEL)'),
  -- UPTM Mérida "Kleber Ramírez"
  ('universidad politécncia territorial del estado merida "kleber ramirez"', 'UNIVERSIDAD POLITÉCNICA TERRITORIAL DEL ESTADO MÉRIDA "KLEBER RAMÍREZ" (UPTM)'),
  ('universidad politécnica territorial del estado mérida "kleber ramírez"', 'UNIVERSIDAD POLITÉCNICA TERRITORIAL DEL ESTADO MÉRIDA "KLEBER RAMÍREZ" (UPTM)'),
  ('universidad politécnica territorial del estado mérida kléber ramírez', 'UNIVERSIDAD POLITÉCNICA TERRITORIAL DEL ESTADO MÉRIDA "KLEBER RAMÍREZ" (UPTM)'),
  ('universidad politécnica territorial del estado mérida kleber ramirez (uptm)', 'UNIVERSIDAD POLITÉCNICA TERRITORIAL DEL ESTADO MÉRIDA "KLEBER RAMÍREZ" (UPTM)'),
  -- Monseñor de Talavera
  ('colegio universitario "monseñor de talavera"', 'Colegio Universitario Monseñor de Talavera'),
  ('monseñor de talavera', 'Colegio Universitario Monseñor de Talavera'),
  -- Santiago Mariño
  ('instituto universitario politecnico santiago mariño', 'Instituto Universitario Politécnico Santiago Mariño'),
  -- Antonio José de Sucre
  ('instituto tecnologico universitario antonio josé de sucre', 'Instituto Universitario de Tecnología Antonio José de Sucre (IUTAJS)'),
  ('instituto universitario tecnología antonio josé de sucre (iutajs)', 'Instituto Universitario de Tecnología Antonio José de Sucre (IUTAJS)'),
  ('iuta', 'Instituto Universitario de Tecnología Antonio José de Sucre (IUTAJS)'),
  -- IUPFAN
  ('instituto universitario politécnico de las fuerzas armadas nacionales ( iupfan)', 'Instituto Universitario Politécnico de las Fuerzas Armadas Nacionales (IUPFAN)'),
  -- Simón Bolívar
  ('universidad nacional experimental simón bolivar', 'Universidad Nacional Experimental Simón Bolívar'),
  -- Sedes de la UPEL con nombre propio (decisión del 2026-10-18)
  ('upel maracay', 'UNIVERSIDAD PEDAGÓGICA EXPERIMENTAL LIBERTADOR (UPEL-IP MARACAY)'),
  ('upel-ipb luis beltrán prieto figueroa', 'UNIVERSIDAD PEDAGÓGICA EXPERIMENTAL LIBERTADOR (UPEL-IPB LUIS BELTRÁN PRIETO FIGUEROA)'),
  -- Expansión de siglas (nombres verificados con fuentes oficiales, 2026-10-18)
  ('unefa', 'UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA DE LA FUERZA ARMADA NACIONAL BOLIVARIANA (UNEFA)'),
  ('uptaeb', 'UNIVERSIDAD POLITÉCNICA TERRITORIAL DE LARA "ANDRÉS ELOY BLANCO" (UPTAEB)'),
  ('unexca', 'UNIVERSIDAD NACIONAL EXPERIMENTAL DE LA GRAN CARACAS (UNEXCA)'),
  ('iujo', 'Instituto Universitario Jesús Obrero (IUJO)'),
  ('inces', 'Instituto Nacional de Capacitación y Educación Socialista (INCES)'),
  ('cuam', 'Colegio Universitario de Administración y Mercadeo (CUAM)'),
  ('avepane', 'Asociación Venezolana de Padres y Amigos de Niños Excepcionales (AVEPANE)');

update public.censo_egresados c
   set universidad = m.canonica
  from mapa_universidades m
 where lower(regexp_replace(btrim(c.universidad), '\s+', ' ', 'g')) = m.variante;

update public.titulos_adicionales t
   set universidad = m.canonica
  from mapa_universidades m
 where lower(regexp_replace(btrim(t.universidad), '\s+', ' ', 'g')) = m.variante;

-- Verificación: ya no deben aparecer las variantes viejas
select universidad, count(*)
  from public.censo_egresados
 group by universidad
 order by count(*) desc, universidad;
