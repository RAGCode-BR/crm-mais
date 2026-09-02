-- Cover the composite foreign keys in their declared column order.
-- The existing contact lookup indexes use (organization_id, contact_id, company_id)
-- and remain useful for contact-centric queries, but cannot cover these FKs.

create index leads_contact_company_fk_idx
  on public.leads (organization_id, company_id, contact_id)
  where company_id is not null and contact_id is not null;

create index opportunities_contact_fk_idx
  on public.opportunities (organization_id, company_id, contact_id)
  where contact_id is not null;
