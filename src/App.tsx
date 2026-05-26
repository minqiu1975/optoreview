import { Routes, Route, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import Home from './pages/Home'
import WorkflowPage from './pages/WorkflowPage'
import ReportsPage from './pages/ReportsPage'
import FAQPage from './pages/FAQPage'
import AnalyzePage from './pages/AnalyzePage'
import AdminPanel from './sections/AdminPanel'

/* Page transition wrapper */
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </PageTransition>
  )
}
