import { ITableGateway } from "@taotask/modules/order/core/gateway/table.gateway";
import { IMealGateway } from "@taotask/modules/order/core/gateway/meal.gateway";
import { IMenuGateway } from "@taotask/modules/order/core/gateway/menu.gateway";
import { IReservationGateway } from "@taotask/modules/order/core/gateway/reservation.gateway";
import { IRestaurantGateway } from "@taotask/modules/order/core/gateway/restaurant.gateway";
import { ITerminalReservationGateway } from "@taotask/modules/terminal/core/gateway/terminal-reservation.gateway";
import { DemoRestaurantGateway } from "@taotask/modules/order/core/gateway-infra/demo.restaurant-gateway";
import { DemoTableGateway } from "@taotask/modules/order/core/gateway-infra/demo.table-gateway";
import { DemoMealGateway } from "@taotask/modules/order/core/gateway-infra/demo.meal-gateway";
import { HttpTableGateway } from "@taotask/modules/order/core/gateway/http.table-gateway";
import { HttpMealGateway } from "@taotask/modules/order/core/gateway/http.meal-gateway";
import { HttpMenuGateway } from "@taotask/modules/order/core/gateway/http.menu-gateway";
import { HttpRestaurantGateway } from "@taotask/modules/order/core/gateway/http.restaurant-gateway";
import { HttpReservationGateway } from "@taotask/modules/order/core/gateway/http.reservation-gateway";
import { HttpTerminalReservationGateway } from "@taotask/modules/terminal/core/gateway/http.terminal-reservation-gateway";
import { API_CONFIG } from "@taotask/modules/app/config/api.config";
import { AppState } from "@taotask/modules/store/store";
import { MockReservationGateway } from "@taotask/modules/order/core/testing/mock.reservation-gateway";
import { HttpClient } from "@taotask/modules/shared/infrastructure/http-client";
import { DemoRestaurantsStore } from "@taotask/modules/shared/demo/demo-restaurants.store";
import { DemoTablesStore } from "@taotask/modules/shared/demo/demo-tables.store";
import { DemoMealsStore } from "@taotask/modules/shared/demo/demo-meals.store";

export class GatewayFactory {
    private static httpClient = new HttpClient();

    static createTableGateway(
        getState: () => AppState,
        demoTablesStore: DemoTablesStore,
    ): ITableGateway {
        const primary = API_CONFIG.isApiAvailable()
            ? new HttpTableGateway(this.httpClient, getState)
            : null;
        return new DemoTableGateway(primary, demoTablesStore, getState);
    }

    static createMealGateway(
        getState: () => AppState,
        demoMealsStore: DemoMealsStore,
    ): IMealGateway {
        const primary = API_CONFIG.isApiAvailable()
            ? new HttpMealGateway(this.httpClient, getState)
            : null;
        return new DemoMealGateway(primary, demoMealsStore, getState);
    }

    static createReservationGateway(getState: () => AppState): IReservationGateway {
        if (API_CONFIG.isApiAvailable()) {
            return new HttpReservationGateway(this.httpClient, getState);
        }
        return new MockReservationGateway();
    }

    static createRestaurantGateway(demoStore: DemoRestaurantsStore): IRestaurantGateway {
        const primary = API_CONFIG.isApiAvailable()
            ? new HttpRestaurantGateway(this.httpClient)
            : null;
        return new DemoRestaurantGateway(primary, demoStore);
    }

    static createMenuGateway(): IMenuGateway {
        return new HttpMenuGateway(this.httpClient);
    }

    static createTerminalReservationGateway(): ITerminalReservationGateway {
        return new HttpTerminalReservationGateway(this.httpClient);
    }
}