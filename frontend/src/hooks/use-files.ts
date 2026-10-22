import { useMutation } from '@tanstack/react-query'
import { filesApi } from '@/api/files'

/** Uploads a batch of files for a class and resolves to the stored file records. */
export function useUploadFiles(classId: number) {
  return useMutation({
    mutationFn: ({ files, onProgress }: { files: File[]; onProgress?: (percent: number) => void }) =>
      filesApi.upload(classId, files, onProgress),
  })
}
