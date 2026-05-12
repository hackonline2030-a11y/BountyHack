import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import { DemoTable } from '@taotask/modules/shared/demo/demo-tables.store';

export const mapDemoToOrderTable = (table: DemoTable): OrderingDomainModel.Table => ({
  id: table.id.toString(),
  title: table.title,
  capacity: table.capacity,
});
