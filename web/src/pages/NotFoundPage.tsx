import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'

export function NotFoundPage() {
  return (
    <div className="not-found">
      <section className="page-card">
        <div className="stack">
          <p className="eyebrow">404</p>
          <h1>Questa rotta non esiste.</h1>
          <p className="muted">Quando la SPA sarà pubblicata nella root del dominio, le rotte client saranno servite da `index.html` tramite `.htaccess`.</p>
          <Link to="/">
            <Button>Torna alla home</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}