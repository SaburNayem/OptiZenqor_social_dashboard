import './App.css'
import { AdminSessionProvider } from './context/AdminSessionContext'
import { useAdminSession } from './hooks/useAdminSession'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminWorkspacePage } from './pages/admin/AdminWorkspacePage'

function AppBody() {
  const { session } = useAdminSession()
  return session?.accessToken ? <AdminWorkspacePage /> : <AdminLoginPage />
}

function App() {
  return (
    <AdminSessionProvider>
      <AppBody />
    </AdminSessionProvider>
  )
}

export default App
