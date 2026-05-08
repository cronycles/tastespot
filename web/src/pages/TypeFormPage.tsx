import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { getActivityTypeIcon } from "@/lib/activityTypeIcons";
import { AVAILABLE_ICONS, DEFAULT_ICON_KEY } from "@/types";
import { useTypesStore } from "@/stores/typesStore";

type TypeFormValues = {
    name: string;
    description: string;
    iconKey: string;
};

const EMPTY_FORM: TypeFormValues = {
    name: "",
    description: "",
    iconKey: DEFAULT_ICON_KEY,
};

export function TypeFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { types, fetch, create, update } = useTypesStore();

    const isEditing = Boolean(id);
    const currentType = useMemo(() => types.find(type => type.id === id) ?? null, [id, types]);

    useEffect(() => {
        if (types.length === 0) void fetch();
    }, [fetch, types.length]);

    const initialForm = currentType
        ? {
              name: currentType.name,
              description: currentType.description ?? "",
              iconKey: currentType.icon_key,
          }
        : EMPTY_FORM;

    const formKey = currentType ? `${currentType.id}:${currentType.name}:${currentType.icon_key}` : "new";

    return (
        <section className="page-card types-editor">
            <PageHeader
                title={isEditing ? "Modifica tipologia" : "Nuova tipologia"}
                subtitle="Definisci il nome, la descrizione e l'icona della tipologia."
                onBack={() => navigate("/private/types")}
            />

            <TypeEditorForm
                key={formKey}
                id={id}
                isEditing={isEditing}
                initialForm={initialForm}
                create={create}
                update={update}
                onCancel={() => navigate("/private/types")}
                onComplete={() => navigate("/private/types")}
            />
        </section>
    );
}

type TypeEditorFormProps = {
    id?: string;
    isEditing: boolean;
    initialForm: TypeFormValues;
    create: (name: string, description: string | null, iconKey: string) => Promise<string | null>;
    update: (id: string, name: string, description: string | null, iconKey: string) => Promise<string | null>;
    onCancel: () => void;
    onComplete: () => void;
};

function TypeEditorForm({ id, isEditing, initialForm, create, update, onCancel, onComplete }: TypeEditorFormProps) {
    const [form, setForm] = useState<TypeFormValues>(initialForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setFormError(null);

        if (!form.name.trim()) {
            setFormError("Il nome e' obbligatorio.");
            return;
        }

        setSaving(true);
        const error =
            isEditing && id ? await update(id, form.name.trim(), form.description || null, form.iconKey) : await create(form.name.trim(), form.description || null, form.iconKey);
        setSaving(false);

        if (error) {
            setFormError(error);
            return;
        }

        onComplete();
    }

    return (
        <form className="types-form" onSubmit={event => void handleSubmit(event)}>
            <div className="field">
                <label htmlFor="type-name">Nome *</label>
                <input
                    id="type-name"
                    value={form.name}
                    onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
                    placeholder="es. Ristorante, Bar, Gelateria"
                    required
                />
            </div>

            <div className="field">
                <label htmlFor="type-description">Descrizione</label>
                <textarea
                    id="type-description"
                    value={form.description}
                    onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
                    placeholder="Descrizione opzionale"
                    rows={3}
                />
            </div>

            <div className="content-stack">
                <h3>Icona</h3>
                <div className="types-icon-grid">
                    {AVAILABLE_ICONS.map(iconKey => {
                        const Icon = getActivityTypeIcon(iconKey);
                        const active = form.iconKey === iconKey;

                        return (
                            <button
                                key={iconKey}
                                type="button"
                                className={`types-icon-cell${active ? " active" : ""}`}
                                onClick={() => setForm(current => ({ ...current, iconKey }))}
                                aria-label={`Seleziona icona ${iconKey}`}
                            >
                                <Icon />
                            </button>
                        );
                    })}
                </div>
            </div>

            {formError ? <div className="status-banner error">{formError}</div> : null}

            <div className="inline-actions">
                <Button type="submit" disabled={saving}>
                    {saving ? "Salvataggio..." : isEditing ? "Salva modifiche" : "Crea tipologia"}
                </Button>
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Annulla
                </Button>
            </div>
        </form>
    );
}
