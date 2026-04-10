import type { IconType } from "react-icons";
import {
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

const iconMap: Record<string, IconType> = {
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
};

const markerSymbolMap: Record<string, string> = {
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
};

export function getActivityTypeIcon(iconKey?: string): IconType {
    if (iconKey && iconMap[iconKey]) {
        return iconMap[iconKey];
    }

    return IoStorefrontOutline;
}

export function getMarkerSymbol(iconKey?: string): string {
    if (iconKey && markerSymbolMap[iconKey]) {
        return markerSymbolMap[iconKey];
    }

    return markerSymbolMap["storefront-outline"];
}
