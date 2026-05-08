import type { ReactNode } from "react";
import { IoArrowBackOutline } from "react-icons/io5";

type Props = {
    title: string;
    eyebrow?: string;
    subtitle?: string;
    onBack?: () => void;
    actions?: ReactNode;
};

export function PageHeader({ title, eyebrow, subtitle, onBack, actions }: Props) {
    return (
        <div className="page-header">
            <div className="page-header-row">
                {onBack ? (
                    <button type="button" className="page-header-back" onClick={onBack} aria-label="Torna indietro">
                        <IoArrowBackOutline />
                    </button>
                ) : null}
                <div className="page-header-body">
                    {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
                    <h1>{title}</h1>
                    {subtitle ? <p className="page-header-subtitle">{subtitle}</p> : null}
                </div>
                {actions ? <div className="page-header-actions">{actions}</div> : null}
            </div>
        </div>
    );
}
