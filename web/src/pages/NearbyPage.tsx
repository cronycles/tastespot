import { ActivitiesListPanel } from "@/components/ActivitiesListPanel";

export function NearbyPage() {
    return <ActivitiesListPanel title="Vicino a me" eyebrow="Vicino a me" initialSortKey="distance" initialSortDir="asc" autoRequestLocation />;
}
