import { ActivitiesListPanel } from "@/components/ActivitiesListPanel";

export function NearbyPage() {
    return <ActivitiesListPanel title="Vicino a me" eyebrow="Intorno a te" initialSortKey="distance" initialSortDir="asc" autoRequestLocation />;
}
