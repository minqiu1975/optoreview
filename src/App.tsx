import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import AdminPanel from './sections/AdminPanel'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  )
}
