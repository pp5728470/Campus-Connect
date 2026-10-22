import { Download } from 'lucide-react'
import { useState } from 'react'
import { gradesApi, type ExportFormat } from '@/api/grades'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { getErrorMessage } from '@/lib/errors'

/** CSV and Excel download buttons for the gradebook. */
export function ExportButtons({ classId, className }: { classId: number; className: string }) {
  const toast = useToast()
  const [pending, setPending] = useState<ExportFormat | null>(null)

  const download = async (format: ExportFormat) => {
    setPending(format)
    try {
      await gradesApi.export(classId, format, `${className}-grades`.replace(/\s+/g, '-'))
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not export the gradebook.'))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" loading={pending === 'csv'} onClick={() => void download('csv')}>
        <Download className="size-4" aria-hidden="true" />
        Export CSV
      </Button>
      <Button variant="secondary" size="sm" loading={pending === 'xlsx'} onClick={() => void download('xlsx')}>
        <Download className="size-4" aria-hidden="true" />
        Export Excel
      </Button>
    </div>
  )
}
