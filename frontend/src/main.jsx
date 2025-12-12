import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* El Router envuelve a toda la aplicación aquí */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)