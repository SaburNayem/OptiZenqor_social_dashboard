import { useContext } from 'react'
import { AdminSessionContext } from '../context/AdminSessionContext'

export function useAdminSession() {
  const context = useContext(AdminSessionContext)
  if (!context) {
    throw new Error('useAdminSession must be used inside AdminSessionProvider.')
  }
  return context
}
