import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import { DemoMeal } from '@taotask/modules/shared/demo/demo-meals.store';

export const mapDemoToOrderMeal = (meal: DemoMeal): OrderingDomainModel.Meal => ({
  id: meal.id.toString(),
  restaurantId: meal.restaurantId.toString(),
  title: meal.title,
  type: meal.type as OrderingDomainModel.MealType,
  price: meal.price,
  requiredAge: meal.requiredAge,
  imageUrl: meal.imageUrl,
});
