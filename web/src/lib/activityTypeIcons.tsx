import type { IconType } from "react-icons";
import {
    IoAppsOutline,
    IoBeerOutline,
    IoBasketOutline,
    IoCafeOutline,
    IoFastFoodOutline,
    IoIceCreamOutline,
    IoNutritionOutline,
    IoPizzaOutline,
    IoRestaurantOutline,
    IoStorefrontOutline,
    IoWineOutline,
} from "react-icons/io5";
import { LuSandwich } from "react-icons/lu";
import { DEFAULT_ICON_KEY, type AvailableIconKey } from "@/types";

const iconMap: Record<AvailableIconKey, IconType> = {
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
    "tapas-outline": LuSandwich,
};

const markerSymbolMap: Record<AvailableIconKey, string> = {
    "restaurant-outline": "🍽",
    "cafe-outline": "☕",
    "beer-outline": "🍺",
    "wine-outline": "🍷",
    "pizza-outline": "🍕",
    "fast-food-outline": "🍔",
    "ice-cream-outline": "🍨",
    "nutrition-outline": "🥗",
    "storefront-outline": "🏬",
    "basket-outline": "🛒",
    "tapas-outline": "🥪",
};

function isKnownIconKey(iconKey: string): iconKey is AvailableIconKey {
    return iconKey in iconMap;
}

export function getActivityTypeIcon(iconKey?: string): IconType {
    if (iconKey && isKnownIconKey(iconKey)) {
        return iconMap[iconKey];
    }

    return IoStorefrontOutline;
}

export function getMarkerSymbol(iconKey?: string): string {
    if (iconKey && isKnownIconKey(iconKey)) {
        return markerSymbolMap[iconKey];
    }

    return markerSymbolMap[DEFAULT_ICON_KEY];
}

export function getActivityMarkerIcon(typeIconKeys: string[]): IconType {
    const uniqueKnownKeys = [...new Set(typeIconKeys.filter(isKnownIconKey))];

    if (uniqueKnownKeys.length === 1) {
        return iconMap[uniqueKnownKeys[0]];
    }

    if (uniqueKnownKeys.length > 1) {
        return IoAppsOutline;
    }

    return IoStorefrontOutline;
}
