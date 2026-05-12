import { DemoTableGateway } from '@taotask/modules/order/core/gateway-infra/demo.table-gateway';
import { DemoTablesStore } from '@taotask/modules/shared/demo/demo-tables.store';
import { ITableGateway } from '@taotask/modules/order/core/gateway/table.gateway';
import { AppState } from '@taotask/modules/store/store';

const createState = (restaurantId: string | number | null): AppState =>
  ({
    ordering: {
      restaurantId,
    },
  } as AppState);

describe('DemoTableGateway', () => {
  it('returns demo tables for demo restaurant', async () => {
    const store = new DemoTablesStore();
    const gateway = new DemoTableGateway(null, store, () => createState('-1'));

    const tables = await gateway.getTables();
    expect(tables.length).toBeGreaterThan(0);
  });

  it('returns API tables for real restaurant', async () => {
    const store = new DemoTablesStore();
    const primary: ITableGateway = {
      getTables: async () => [{ id: '10', title: 'API', capacity: 4 }],
      getActiveOrder: async () => null,
    };
    const gateway = new DemoTableGateway(primary, store, () => createState('10'));

    const tables = await gateway.getTables();
    expect(tables).toHaveLength(1);
    expect(tables[0].id).toBe('10');
  });
});
