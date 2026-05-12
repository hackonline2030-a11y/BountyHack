import { IMealGateway } from "@taotask/modules/order/core/gateway/meal.gateway";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { MealFactory } from "@taotask/modules/order/core/model/meal.factory";
// Ecrire ces plats ici ne suffira pas >> encore faudra t-il un usecase (usecase: fetch-meals)
export class InMemoryMealGateway implements IMealGateway {
    async getMeals(): Promise<OrderingDomainModel.Meal[]> {
        return [
            MealFactory.create({
                id: '14',
                restaurantId: '1',
                imageUrl: '/entries/toast-saumon-pexels-nadin-sh-78971847-26756758.jpg',
                title: 'Délice de saumon',
                type: OrderingDomainModel.MealType.ENTRY,
                price: 3.5,
                requiredAge: 0,
            }),
            {id: '1', restaurantId:"1",imageUrl:"/mainCourses/poulet-pexels-karolina-grabowska-5718025.jpg", title: 'Poulet braisé', type: OrderingDomainModel.MealType.MAIN_COURSE, requiredAge:0, price: 5},
            {id: '2', restaurantId:"1",imageUrl:"/mainCourses/fougasse-pexels-nadin-sh-78971847-21753113.jpg", title: 'Fougasse des Alpilles', type: OrderingDomainModel.MealType.MAIN_COURSE, requiredAge:18, price: 5},
            {id: '3', restaurantId:"1",imageUrl:"/mainCourses/salad-cream-pexels-julieaagaard-2097090.jpg", title: 'Salade croustillarde', type: OrderingDomainModel.MealType.MAIN_COURSE, requiredAge:0, price: 5},
            {id: '4', restaurantId:"1",imageUrl:"/mainCourses/toast-pexels-cristian-rojas-8230026.jpg", title: 'Toasts au Rhum', type: OrderingDomainModel.MealType.MAIN_COURSE, requiredAge:18, price: 5},
            {id: '5', restaurantId:"1",imageUrl:"/entries/aubergines-pexels-zehra-yilmaz-407275500-18109101.jpg", title: 'Folie d\'Aubergines', type: OrderingDomainModel.MealType.ENTRY, requiredAge:0, price: 5},
            {id: '6', restaurantId:"1",imageUrl:"/entries/toast-oeuf-pexels-kyleroxas-2122294.jpg", title: 'Toast Dominique', type: OrderingDomainModel.MealType.ENTRY, requiredAge:0, price: 2},
            {id: '7', restaurantId:"1",imageUrl:"/entries/salade-olive-pexels-dana-tentis-118658-1213710.jpg", title: 'Salade Oliverade', type: OrderingDomainModel.MealType.ENTRY, requiredAge:0, price: 4},
            {id: '8', restaurantId:"1",imageUrl:"/entries/toast-avocats-pexels-foodie-factor.jpg", title: 'Avocats Toastés', type: OrderingDomainModel.MealType.ENTRY, requiredAge:0, price: 7},
            {id: '9', restaurantId:"1",imageUrl:"/desserts/tiramisu-pexels-minche11-6880219.jpg", title: 'Tiramisu Alcoolisé', type: OrderingDomainModel.MealType.DESSERT, requiredAge:18, price: 5},
            {id: '10',restaurantId:"1",imageUrl:"/desserts/tiramisu-pexels-minche11-6880219.jpg", title: 'Tiramisu', type: OrderingDomainModel.MealType.DESSERT, requiredAge:0, price: 5},
            {id: '11',restaurantId:"1",imageUrl:"/drinks/wine-pexels-jill-burrow-6858660.jpg", title: 'Vin rouge', type: OrderingDomainModel.MealType.DRINK, requiredAge:18, price: 5},
            {id: '12',restaurantId:"1",imageUrl:"/drinks/orange-pexels-pixabay-158053.jpg", title: 'Jus D\'Orange', type: OrderingDomainModel.MealType.DRINK, requiredAge:0, price: 5},
            {id: '13',restaurantId:"1",imageUrl:"/drinks/coktail-pexels-ifreestock-616836.jpg", title: 'Coktail Cabesou', type: OrderingDomainModel.MealType.DRINK, requiredAge:18, price: 5}
        ]
        
    }
}
