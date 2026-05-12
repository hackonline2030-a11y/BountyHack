// Nous décidons de créer ce gateway aprés avoir terminé ou presque la partie react (presenter)
// Ce gateway permet de reprendre de vrais données issu du domain (à vérifier)

import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

export interface IMealGateway {
    getMeals(): Promise<OrderingDomainModel.Meal[]>; 
}