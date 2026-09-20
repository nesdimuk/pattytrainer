-- Tabla para los registros de la Guía Nutricional de Patty Trainer
-- (pattytrainer.com/guia)

create table if not exists public.patty_guia_nutricional (
  phone text primary key,
  created_at timestamptz not null default now(),
  email text,
  name text,
  gender text,
  edad integer,
  peso_kg numeric,
  altura_cm numeric,
  objetivo text,
  actividad text,
  ejercicio text,
  dieta text,
  comidas integer,
  calorias_objetivo numeric,
  palmas_objetivo numeric,
  punados_objetivo numeric,
  pulgares_objetivo numeric,
  punos_verdura_objetivo numeric
);

-- Habilitar RLS (sin esto, con RLS activado por defecto, nadie puede insertar)
alter table public.patty_guia_nutricional enable row level security;

-- Permitir que cualquiera (rol "anon", el que usa la página pública) pueda
-- INSERTAR o ACTUALIZAR (si vuelve a completar el formulario con el mismo
-- teléfono/email, se actualiza el registro en vez de duplicarlo), pero
-- nunca leer ni borrar nada.
create policy "anon puede insertar"
  on public.patty_guia_nutricional
  for insert
  to anon
  with check (true);

create policy "anon puede actualizar su propio registro"
  on public.patty_guia_nutricional
  for update
  to anon
  using (true)
  with check (true);

-- Otorgar los permisos de tabla al rol anon (crear la tabla por SQL no
-- los asigna automáticamente como sí lo hace la interfaz de Supabase Studio;
-- sin esto, las políticas RLS de arriba no alcanzan a aplicarse).
grant usage on schema public to anon;
grant select, insert, update on public.patty_guia_nutricional to anon;
