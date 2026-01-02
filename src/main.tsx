import 'bootstrap/dist/css/bootstrap.min.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const client = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5,
     // cacheTime: 1000 * 60 * 30,
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}>
    <StrictMode>
      <App />
    </StrictMode>
  </QueryClientProvider>,
)
