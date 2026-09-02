import { describe, expect, it } from 'vitest'

import {
  companySchema,
  contactSchema,
  leadSchema,
  normalizeDigits,
  normalizeEmail,
  safeSearch,
} from './crm.schemas'

const company = {
  tradeName: 'Acme',
  legalName: '',
  taxId: '',
  industry: '',
  companySize: '',
  employeeCount: null,
  website: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  countryCode: 'BR',
  notes: '',
  ownerMemberId: '',
  leadSourceId: '',
  status: 'prospect' as const,
}
const contact = {
  companyId: 'company',
  firstName: 'Ana',
  lastName: '',
  jobTitle: '',
  department: '',
  phone: '',
  whatsapp: '',
  email: '',
  linkedinUrl: '',
  isPrimary: false,
  notes: '',
}
const lead = {
  name: 'Lead',
  companyId: '',
  contactId: '',
  ownerMemberId: '',
  leadSourceId: '',
  email: '',
  phone: '',
  status: 'new' as const,
  temperature: 'warm' as const,
  score: 50,
  nextAction: '',
  nextContactAt: '',
  notes: '',
}

describe('CRM validation and normalization', () => {
  it('accepts valid company, contact and lead payloads', () => {
    expect(companySchema.safeParse(company).success).toBe(true)
    expect(contactSchema.safeParse(contact).success).toBe(true)
    expect(leadSchema.safeParse(lead).success).toBe(true)
  })

  it('validates URLs, score limits and linked contact company', () => {
    expect(companySchema.safeParse({ ...company, website: 'example.com' }).success).toBe(false)
    expect(leadSchema.safeParse({ ...lead, score: 101 }).success).toBe(false)
    expect(leadSchema.safeParse({ ...lead, contactId: 'contact' }).success).toBe(false)
  })

  it('normalizes duplicate lookup values and sanitizes filters', () => {
    expect(normalizeEmail('  ANA@EXAMPLE.COM ')).toBe('ana@example.com')
    expect(normalizeDigits('+55 (11) 99999-0000')).toBe('5511999990000')
    expect(safeSearch('Acme,(SP)%')).toBe('Acme SP')
  })
})
