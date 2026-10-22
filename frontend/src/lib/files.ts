import type { FileResponse } from '@/types'

export type FileKind = 'pdf' | 'doc' | 'ppt' | 'xls' | 'image' | 'zip' | 'other'

/** Matches the backend upload limit (25 MB per file). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

const EXTENSION_KINDS: Record<string, FileKind> = {
  pdf: 'pdf',
  doc: 'doc',
  docx: 'doc',
  odt: 'doc',
  txt: 'doc',
  rtf: 'doc',
  ppt: 'ppt',
  pptx: 'ppt',
  odp: 'ppt',
  xls: 'xls',
  xlsx: 'xls',
  csv: 'xls',
  ods: 'xls',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  zip: 'zip',
  rar: 'zip',
  '7z': 'zip',
  tar: 'zip',
  gz: 'zip',
}

/** Classifies a file by MIME type first, falling back to its extension. */
export function fileKind(name: string, contentType?: string | null): FileKind {
  const mime = contentType?.toLowerCase() ?? ''
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('image/')) return 'image'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'ppt'
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') return 'xls'
  if (mime.includes('zip') || mime.includes('compressed') || mime.includes('x-tar')) return 'zip'
  if (mime.includes('word') || mime.includes('opendocument.text') || mime === 'text/plain') return 'doc'

  const extension = name.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_KINDS[extension] ?? 'other'
}

/** Only PDFs and images can be shown inline in the browser. */
export function isPreviewable(file: Pick<FileResponse, 'originalName' | 'contentType'>): boolean {
  const kind = fileKind(file.originalName, file.contentType)
  return kind === 'pdf' || kind === 'image'
}
