import { Link } from "react-router-dom";
import { Button } from "@/components/Button";

export function NotFoundPage() {
    return (
        <div className="not-found">
            <section className="page-card">
                <div className="stack">
                    <p className="eyebrow">404</p>
                    <h1>Pagina non trovata.</h1>
                    <p className="muted">Il contenuto che stai cercando non e' disponibile.</p>
                    <Link to="/">
                        <Button>Torna alla home</Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
