// Cours Table Gateway 20:00 >> important de comprendre pourquoi on va créer ce listener
import { ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import { orderingSlice } from "./ordering.slice";
import { OrderingDomainModel } from "../model/ordering.domain-model";
import { fetchTables } from "@taotask/modules/order/core/useCase/fetch-table.usecase";
import { fetchMeals } from "@taotask/modules/order/core/useCase/fetch-meals.usecase";
import { fetchMenus } from "@taotask/modules/order/core/useCase/fetch-menus.usecase";
// Event driven --> ici j'ai un évènement sur un évènement
// Dés que je sélectionne un guest j'arrive sur l'étape suivante (ordering.step.listener.ts s'en occuppe)
// Ici je veux que dés que j'arrive sur l'étape table je veux que l'on fetch les tables (voir Cours Gateway 20:15)
// Parfois je vais avoir besoin d'appeler la fonction setStep sans sélectionner de Guest (ex: retour en arrière) d'où j'ai aussi besoin de la logique ci-dessous
export const registerFetcherListeners = (listener: ListenerMiddlewareInstance) => {
    listener.startListening({
        actionCreator: orderingSlice.actions.setStep,
            effect: (action, api) => {
            switch(action.payload) {
                case OrderingDomainModel.OrderingStep.MEALS_PREVIEW: {
                    api.dispatch(fetchMenus as any);
                    api.dispatch(fetchMeals as any);
                    break;
                }
                case OrderingDomainModel.OrderingStep.TABLE: {
                    api.dispatch(fetchTables as any);
                    break;
                }
                case OrderingDomainModel.OrderingStep.MEALS: {
                    api.dispatch(fetchMeals as any);
                    break;
                }
                case OrderingDomainModel.OrderingStep.QR_GUESTS: {
                    // Pre-fetch menus and meals for QR flow
                    api.dispatch(fetchMenus as any);
                    api.dispatch(fetchMeals as any);
                    break;
                }
            }
        }
    });
}