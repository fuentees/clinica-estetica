import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// --- AQUI ESTÁ A MÁGICA ---
// Importando o CSS do calendário na raiz do projeto para garantir que carregue
import 'react-big-calendar/lib/css/react-big-calendar.css'
// ---------------------------

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)