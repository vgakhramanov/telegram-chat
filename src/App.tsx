import { useState } from 'react'
import { Login } from './components/Login'
import { Workspace } from './components/Workspace'
import { clearSession, loadCredentials } from './lib/storage'
import type { Credentials } from './types/chat'

function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(() =>
    loadCredentials(),
  )

  function logout() {
    clearSession()
    setCredentials(null)
  }

  return credentials ? (
    <Workspace credentials={credentials} onLogout={logout} />
  ) : (
    <Login onConnect={setCredentials} />
  )
}

export default App
