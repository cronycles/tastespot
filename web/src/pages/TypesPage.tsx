import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    IoAdd,
    IoArrowDown,
    IoArrowUp,
    IoBeerOutline,
    IoBasketOutline,
    IoCafeOutline,
    IoClose,
    IoFastFoodOutline,
    IoIceCreamOutline,
    IoNutritionOutline,
    IoPencilOutline,
    IoPizzaOutline,
    IoRestaurantOutline,
    IoStorefrontOutline,
    IoTrashOutline,
    IoWineOutline,
} from "react-icons/io5";
import { Button } from "@/components/Button";
import { AVAILABLE_ICONS, DEFAULT_ICON_KEY, type ActivityType } from "@/types";
import { useTypesStore } from "@/stores/typesStore";

const iconMap = {
    "restaurant-outline": IoRestaurantOutline,
    "cafe-outline": IoCafeOutline,
    "beer-outline": IoBeerOutline,
    "wine-outline": IoWineOutline,
    "pizza-outline": IoPizzaOutline,
    "fast-food-outline": IoFastFoodOutline,
    "ice-cream-outline": IoIceCreamOutline,
    "nutrition-outline": IoNutritionOutline,
    "storefront-outline": IoStorefrontOutline,
    "basket-outline": IoBasketOutline,
} as const;

const EMPTY_FORM = {
    name: "",
    description: "",
    iconKey: DEFAULT_ICON_KEY,
};

export function TypesPage() {
    const { types, loading, fetch, create, update, remove, reorder } = useTypesStore();
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<ActivityType | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void fetch();
    }, [fetch]);

    const sortedTypes = useMemo(() => [...types].sort((a, b) => a.display_order - b.display_order), [types]);

    function openCreate(): void {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        setIsOpen(true);
    }

    function openEdit(type: ActivityType): void {
        setEditing(type);
        setForm({
            name: type.name,
            description: type.description ?? "",
            iconKey: type.icon_key,
        });
        setFormError(null);
        setIsOpen(true);
    }

    function closePanel(): void {
        setIsOpen(false);
        setEditing(null);
        setFormError(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setFormError(null);

        if (!form.name.trim()) {
            setFormError("Il nome e' obbligatorio.");
            return;
        }

        setSaving(true);
        const error = editing
            ? await update(editing.id, form.name.trim(), form.description || null, form.iconKey)
            : await create(form.name.trim(), form.description || null, form.iconKey);
        setSaving(false);

        if (error) {
            setFormError(error);
            return;
        }

        closePanel();
    }

    async function handleDelete(type: ActivityType): Promise<void> {
        const confirmed = window.confirm(`Eliminando "${type.name}" verranno rimosse anche le associazioni con le attivita'. Continuare?`);
        if (!confirmed) {
            return;
        }

        const error = await remove(type.id);
        if (error) {
            window.alert(error);
        }
    }

    return (
        <>
            <section className="page-card types-page">
                <div className="panel-title-row">
                    <h1>Tipologie attivita'</h1>
                    <Button onClick={openCreate}>
                        <span className="types-add-button">
                            <IoAdd />
                            Nuova tipologia
                        </span>
                    </Button>
                </div>

                {loading && sortedTypes.length === 0 ? (
                    <div className="empty-state">
                        <div className="content-stack">
                            <h3>Caricamento tipologie...</h3>
                        </div>
                    </div>
                ) : null}

                {!loading && sortedTypes.length === 0 ? (
                    <div className="empty-state">
                        <div className="content-stack">
                            <h3>Nessuna tipologia</h3>
                            <p className="muted">Crea la prima tipologia con il pulsante in alto.</p>
                        </div>
                    </div>
                ) : null}

                {sortedTypes.length > 0 ? (
                    <div className="list">
                        {sortedTypes.map((type, index) => {
                            const Icon = iconMap[type.icon_key as keyof typeof iconMap] ?? IoStorefrontOutline;

                            return (
                                <div className="surface-item types-item" key={type.id}>
                                    <div className="types-reorder-controls">
                                        <button
                                            type="button"
                                            className="types-icon-button"
                                            onClick={() => void reorder(type.id, "up")}
                                            disabled={index === 0}
                                            aria-label="Sposta su"
                                        >
                                            <IoArrowUp />
                                        </button>
                                        <button
                                            type="button"
                                            className="types-icon-button"
                                            onClick={() => void reorder(type.id, "down")}
                                            disabled={index === sortedTypes.length - 1}
                                            aria-label="Sposta giu'"
                                        >
                                            <IoArrowDown />
                                        </button>
                                    </div>

                                    <span className="types-main-icon">
                                        <Icon />
                                    </span>

                                    <div className="types-content">
                                        <strong>{type.name}</strong>
                                        {type.description ? <span className="muted">{type.description}</span> : null}
                                    </div>

                                    <div className="types-row-actions">
                                        <button type="button" className="types-icon-button" onClick={() => openEdit(type)} aria-label="Modifica tipologia">
                                            <IoPencilOutline />
                                        </button>
                                        <button type="button" className="types-icon-button danger" onClick={() => void handleDelete(type)} aria-label="Elimina tipologia">
                                            <IoTrashOutline />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : null}
            </section>

            {isOpen ? (
                <section className="page-card types-editor">
                    <div className="types-editor-header">
                        <div className="content-stack">
                            <h2>{editing ? "Modifica tipologia" : "Nuova tipologia"}</h2>
                        </div>
                        <button type="button" className="types-icon-button" onClick={closePanel} aria-label="Chiudi editor">
                            <IoClose />
                        </button>
                    </div>

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
                                onChange={event =>
                                    setForm(current => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                placeholder="Descrizione opzionale"
                                rows={3}
                            />
                        </div>

                        <div className="content-stack">
                            <h3>Icona</h3>
                            <div className="types-icon-grid">
                                {AVAILABLE_ICONS.map(iconKey => {
                                    const Icon = iconMap[iconKey];
                                    const active = form.iconKey === iconKey;

                                    return (
                                        <button
                                            key={iconKey}
                                            type="button"
                                            className={`types-icon-cell${active ? " active" : ""}`}
                                            onClick={() =>
                                                setForm(current => ({
                                                    ...current,
                                                    iconKey,
                                                }))
                                            }
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
                                {saving ? "Salvataggio..." : editing ? "Salva modifiche" : "Crea tipologia"}
                            </Button>
                            <Button type="button" variant="secondary" onClick={closePanel}>
                                Annulla
                            </Button>
                        </div>
                    </form>
                </section>
            ) : null}
        </>
    );
}
