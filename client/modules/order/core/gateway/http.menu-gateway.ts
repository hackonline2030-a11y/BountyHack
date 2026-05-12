import { IMenuGateway } from "@taotask/modules/order/core/gateway/menu.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { HttpClient } from "@taotask/modules/shared/infrastructure/http-client";

type BackendMenuItem = {
    id: number;
    mealType: 'ENTRY' | 'MAIN_COURSE' | 'DESSERT' | 'DRINK';
    quantity: number;
}

type BackendMenu = {
    id: number;
    restaurantId: number;
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    isActive: boolean;
    items: BackendMenuItem[];
}

const mapBackendMenuToDomain = (backendMenu: BackendMenu): OrderingDomainModel.Menu => {
    return {
        id: String(backendMenu.id),
        restaurantId: String(backendMenu.restaurantId),
        title: backendMenu.title,
        description: backendMenu.description,
        price: backendMenu.price,
        imageUrl: backendMenu.imageUrl,
        items: backendMenu.items.map(item => ({
            mealType: item.mealType as OrderingDomainModel.MealType,
            quantity: item.quantity,
        })),
    };
};

export class HttpMenuGateway implements IMenuGateway {
    constructor(private readonly httpClient: HttpClient) {}

    async getMenus(restaurantId: string | number): Promise<OrderingDomainModel.Menu[]> {
        const backendMenus = await this.httpClient.get<BackendMenu[]>(
            `/menus?restaurantId=${restaurantId}&activeOnly=true`
        );
        return backendMenus.map(mapBackendMenuToDomain);
    }

    async getMenu(id: string): Promise<OrderingDomainModel.Menu | null> {
        try {
            const backendMenu = await this.httpClient.get<BackendMenu>(`/menus/${id}`);
            return mapBackendMenuToDomain(backendMenu);
        } catch {
            return null;
        }
    }
}
