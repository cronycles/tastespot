import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";

export function NotFoundPage() {
    return (
        <div className="not-found">
            <section className="page-card">
                <div className="content-stack">
                    <PageHeader eyebrow="404" title="Pagina non trovata." subtitle="Il contenuto che stai cercando non e' disponibile." />
                    <Link to="/">
                        <Button>Torna alla home</Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
