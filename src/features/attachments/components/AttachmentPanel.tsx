import { Download, File, Paperclip, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { StatePanel } from '@/components/shared/StatePanel'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import type { OrganizationRole } from '@/types/database/identity'
import { roleCanWrite } from '@/features/crm/crm.constants'
import { ATTACHMENT_ACCEPT } from '../attachment.constants'
import {
  downloadAttachment,
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from '../attachment.hooks'
import type { AttachmentRecord, AttachmentTarget } from '../attachment.types'
import { formatFileSize, validateAttachmentFile } from '../attachment.utils'

const canDelete = (role?: OrganizationRole) =>
  role === 'owner' || role === 'admin' || role === 'manager'

export function AttachmentPanel({
  membershipId,
  role,
  target,
}: {
  membershipId: string
  role?: OrganizationRole
  target: AttachmentTarget
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingAttachment, setDeletingAttachment] = useState<AttachmentRecord | null>(null)
  const query = useAttachments(target)
  const upload = useUploadAttachment(target, membershipId)
  const remove = useDeleteAttachment(target)

  const handleFile = async (file?: File) => {
    if (!file) return
    const error = validateAttachmentFile(file)
    if (error) {
      setMessage(error)
      return
    }
    setMessage(null)
    try {
      await upload.mutateAsync(file)
      if (inputRef.current) inputRef.current.value = ''
    } catch (uploadError) {
      setMessage(
        uploadError instanceof Error ? uploadError.message : 'Não foi possível enviar o arquivo.',
      )
    }
  }

  const handleDownload = async (attachment: AttachmentRecord) => {
    setDownloadingId(attachment.id)
    setMessage(null)
    try {
      const url = await downloadAttachment(attachment)
      window.location.assign(url)
    } catch (downloadError) {
      setMessage(
        downloadError instanceof Error
          ? downloadError.message
          : 'Não foi possível baixar o arquivo.',
      )
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (attachment: AttachmentRecord) => {
    setMessage(null)
    try {
      await remove.mutateAsync(attachment)
      setDeletingAttachment(null)
    } catch (deleteError) {
      setMessage(
        deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir o anexo.',
      )
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Paperclip className="size-4" /> Anexos e documentos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Arquivos privados de até 20 MB. Links de download expiram em 1 minuto.
          </p>
        </div>
        {roleCanWrite(role) ? (
          <>
            <input
              accept={ATTACHMENT_ACCEPT}
              className="sr-only"
              onChange={(event) => void handleFile(event.target.files?.[0])}
              ref={inputRef}
              type="file"
            />
            <Button disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
              <Upload className="size-4" />
              {upload.isPending ? 'Enviando...' : 'Enviar arquivo'}
            </Button>
          </>
        ) : null}
      </header>
      {message ? <p className="mx-5 mt-4 text-sm text-red-600">{message}</p> : null}
      {query.isLoading ? (
        <div className="p-5">
          <StatePanel kind="loading">Carregando anexos...</StatePanel>
        </div>
      ) : query.error ? (
        <div className="p-5">
          <StatePanel kind="error">{query.error.message}</StatePanel>
        </div>
      ) : query.data?.length ? (
        <ul className="divide-y divide-border">
          {query.data.map((attachment) => (
            <li
              className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              key={attachment.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                  <File className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size_bytes)} ·{' '}
                    {new Date(attachment.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={downloadingId === attachment.id}
                  onClick={() => void handleDownload(attachment)}
                  variant="outline"
                >
                  <Download className="size-4" /> Baixar
                </Button>
                {canDelete(role) ? (
                  <Button
                    disabled={remove.isPending}
                    onClick={() => setDeletingAttachment(attachment)}
                    variant="ghost"
                    aria-label={`Excluir ${attachment.file_name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-5">
          <StatePanel>Nenhum arquivo anexado.</StatePanel>
        </div>
      )}
      <ConfirmDialog
        confirmLabel="Excluir anexo"
        description={`O arquivo “${deletingAttachment?.file_name ?? ''}” será removido permanentemente.`}
        onCancel={() => setDeletingAttachment(null)}
        onConfirm={() => {
          if (deletingAttachment) void handleDelete(deletingAttachment)
        }}
        open={Boolean(deletingAttachment)}
        pending={remove.isPending}
        title="Excluir este anexo?"
      />
    </section>
  )
}
