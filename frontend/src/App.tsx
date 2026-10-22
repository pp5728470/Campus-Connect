import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
import { AppRoutes } from '@/routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
