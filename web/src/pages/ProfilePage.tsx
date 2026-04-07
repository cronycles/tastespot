import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { useAuthStore } from '@/stores/authStore'

export function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
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
        <p className="eyebrow">Fase 8</p>
        <h1>Profilo</h1>
        <p className="muted">Gestione account web collegato a Laravel Sanctum.</p>
      </div>

      {user ? (
        <div className="metric-row">
          <div className="metric-card">
            <span className="muted">Nome</span>
            <span className="metric-value" style={{ fontSize: '1.1rem' }}>{user.name}</span>
          </div>
          <div className="metric-card">
            <span className="muted">Email</span>
            <span className="metric-value" style={{ fontSize: '1.1rem' }}>{user.email}</span>
          </div>
        </div>
      ) : null}

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
        <Link className="list-item" to="/nearby">
          <strong>Vicino a me</strong>
          <span className="muted">Lista ordinata per distanza dalla tua posizione</span>
        </Link>
        <Link className="list-item" to="/favorites">
          <strong>Preferiti</strong>
          <span className="muted">Accesso rapido ai locali salvati</span>
        </Link>
        <div className="list-item">
          <strong>Sicurezza account</strong>
          <span className="muted">Cambio password disponibile quando esposto endpoint dedicato lato backend.</span>
        </div>
      </div>

      <Button variant="danger" onClick={handleLogout}>
        Esci
      </Button>
    </section>
  )
}