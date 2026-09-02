-- BLOCO 3: non-unique lookup indexes used by duplicate warnings.
-- They intentionally do not enforce uniqueness: users can confirm and save a match.
create index companies_phone_idx
  on public.companies (organization_id, phone)
  where phone is not null;

create index contacts_whatsapp_idx
  on public.contacts (organization_id, whatsapp)
  where whatsapp is not null;
