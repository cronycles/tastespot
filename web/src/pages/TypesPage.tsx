import { AVAILABLE_ICONS } from '@/types'

export function TypesPage() {
  return (
    <section className="page-card">
      <div className="stack">
        <p className="eyebrow">Store riusabile</p>
        <h1>Tipologie attività</h1>
        <p className="muted">
          Questa pagina è pronta per ricevere il porting diretto di `typesStore` e della UI CRUD. Le icone supportate sono già allineate al progetto mobile.
        </p>
      </div>

      <div className="list">
        {AVAILABLE_ICONS.map((iconKey) => (
          <div className="list-item" key={iconKey}>
            <strong>{iconKey}</strong>
            <span className="muted">Icona disponibile per il form create/edit tipologie.</span>
          </div>
        ))}
      </div>
    </section>
  )
}