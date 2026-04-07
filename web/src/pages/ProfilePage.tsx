import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { useAuthStore } from '@/stores/authStore'

export function ProfilePage() {
  const navigate = useNavigate()
  const signOut = useAuthStore((state) => state.signOut)
  const isNewUser = useAuthStore((state) => state.isNewUser)
  const dismissWelcome = useAuthStore((state) => state.dismissWelcome)

  async function handleLogout(): Promise<void> {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <section className="profile-card">
      <div className="stack">
        <p className="eyebrow">Area privata</p>
        <h1>Profilo</h1>
        <p className="muted">Da qui attacco tipologie, sicurezza account e logout.</p>
      </div>

      {isNewUser ? (
        <div className="status-banner info">
          Account creato correttamente. La web app usa gia' il token Sanctum del backend.
          <div className="inline-actions" style={{ marginTop: '10px' }}>
            <Button variant="secondary" onClick={dismissWelcome}>
              Chiudi
            </Button>
          </div>
        </div>
      ) : null}

      <div className="profile-actions">
        <Link className="list-item" to="/private/types">
          <strong>Tipologie attività</strong>
          <span className="muted">CRUD, ordinamento e icone</span>
        </Link>
        <div className="list-item">
          <strong>Sicurezza account</strong>
          <span className="muted">Endpoint cambio password da aggiungere lato Laravel nella fase successiva.</span>
        </div>
      </div>

      <Button variant="danger" onClick={handleLogout}>
        Esci
      </Button>
    </section>
  )
}