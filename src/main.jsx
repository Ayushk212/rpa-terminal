import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// StrictMode REMOVED — it double-invokes effects which races with the
// async 50k baseline builder. The mountedRef guard in useStream.js
// provides the same unmount-safety without the double-invoke side-effect.
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
