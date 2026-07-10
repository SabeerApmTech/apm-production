import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@/store'
import './index.css'
// Side-effect import: applies the persisted theme class before the first paint, wherever the
// user lands — not just once Header.tsx's chunk (which owns the toggle button) happens to load.
import '@/hooks/useTheme'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
