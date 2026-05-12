import { ITableGateway } from '@taotask/modules/order/core/gateway/table.gateway';
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import { DemoTablesStore } from '@taotask/modules/shared/demo/demo-tables.store';
import { mapDemoToOrderTable } from '@taotask/modules/order/core/model/demo-table.mapper';
import { AppState } from '@taotask/modules/store/store';
import { isDemoEntityId, toDemoNumberId } from '@taotask/modules/shared/demo/demo-utils';

export class DemoTableGateway implements ITableGateway {
  constructor(
    private readonly primary: ITableGateway | null,
    private readonly demoStore: DemoTablesStore,
    private readonly getState: () => AppState,
  ) {}

  async getTables(): Promise<OrderingDomainModel.Table[]> {
    const restaurantId = this.getState().ordering.restaurantId;
    if (!restaurantId) {
      return [];
    }

    let apiTables: OrderingDomainModel.Table[] = [];
    if (this.primary) {
      try {
        apiTables = await this.primary.getTables();
      } catch {
        apiTables = [];
      }
    }

    if (!isDemoEntityId(restaurantId)) {
      return apiTables;
    }

    const demoId = toDemoNumberId(restaurantId);
    if (demoId === null) {
      return apiTables;
    }

    const demoTables = this.demoStore.listByRestaurantId(demoId).map(mapDemoToOrderTable);
    return [...demoTables, ...apiTables];
  }

  async getActiveOrder(tableId: string): Promise<OrderingDomainModel.ExistingOrder | null> {
    if (isDemoEntityId(tableId)) {
      return null;
    }
    if (!this.primary) {
      return null;
    }
    return this.primary.getActiveOrder(tableId);
  }
}
