import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import './lib/reactflow-theme.css'
import './lib/theme-transitions.css'
import App from './App.tsx'
import { DrawingProvider } from './contexts/DrawingContext'
import { ParameterProvider } from './contexts/ParameterContext'
import { ThemeProvider } from 'next-themes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      storageKey="ui-webcdu-theme"
      disableTransitionOnChange={false}
    >
      <DrawingProvider>
        <ParameterProvider>
          <App />
        </ParameterProvider>
      </DrawingProvider>
    </ThemeProvider>
  </StrictMode>,
)
