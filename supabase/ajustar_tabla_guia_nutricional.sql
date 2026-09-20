-- Ajuste: quitar la restricción de teléfono único (primary key) para que
-- cada envío del formulario cree un registro nuevo, en vez de intentar
-- "actualizar" uno existente (eso es lo que causaba el error de RLS).

alter table public.patty_guia_nutricional drop constraint patty_guia_nutricional_pkey;

alter table public.patty_guia_nutricional
  add column id bigint generated always as identity primary key;

-- Ya no se necesita permiso de UPDATE (cada envío es un insert nuevo)
drop policy if exists "anon puede actualizar su propio registro" on public.patty_guia_nutricional;
revoke update on public.patty_guia_nutricional from anon;
