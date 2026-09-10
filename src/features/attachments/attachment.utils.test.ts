import { describe, expect, it } from 'vitest'
import { ATTACHMENT_MAX_SIZE } from './attachment.constants'
import { formatFileSize, sanitizeFileName, validateAttachmentFile } from './attachment.utils'

describe('attachment utilities', () => {
  it('accepts supported files within the private bucket limit', () => {
    expect(
      validateAttachmentFile({ name: 'proposta.pdf', size: 1024, type: 'application/pdf' }),
    ).toBeNull()
  })

  it('rejects empty, oversized and unsupported files', () => {
    expect(validateAttachmentFile({ name: 'vazio.pdf', size: 0, type: 'application/pdf' })).toMatch(
      /vazio/i,
    )
    expect(
      validateAttachmentFile({
        name: 'grande.pdf',
        size: ATTACHMENT_MAX_SIZE + 1,
        type: 'application/pdf',
      }),
    ).toMatch(/20 MB/i)
    expect(
      validateAttachmentFile({ name: 'script.exe', size: 10, type: 'application/x-msdownload' }),
    ).toMatch(/Formato/i)
  })

  it('normalizes storage names and formats sizes', () => {
    expect(sanitizeFileName('Proposta São Paulo #1.pdf')).toBe('Proposta-Sao-Paulo-1.pdf')
    expect(formatFileSize(1_048_576)).toBe('1.0 MB')
  })
})
