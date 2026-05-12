import { ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import { orderingSlice } from "./ordering.slice";
import { OrderingDomainModel } from "../model/ordering.domain-model";

// On concentrer toute la logique de gestion des étapes via redux ici
//On sépare donc cela des config pure de redux présente dans store.ts (on appel là bas que cette fonction créé ici)
export const registerOrderingStepListener = (listener: ListenerMiddlewareInstance) => {
    listener.startListening({
        // Dés que l'on sélectionne un restaurant on passe à l'aperçu des plats
        actionCreator: orderingSlice.actions.setRestaurantId,
        effect: (_, api) => {
          api.dispatch(orderingSlice.actions.setStep(OrderingDomainModel.OrderingStep.MEALS_PREVIEW));
        }
      });

    listener.startListening({
        // Dés que l'on choisis une table on passe à l'étape de choix des invités
        actionCreator: orderingSlice.actions.chooseTable,
        effect: (_, api) => {
          api.dispatch(orderingSlice.actions.setStep(OrderingDomainModel.OrderingStep.GUESTS));
        }
      });

    listener.startListening({
        // Dés que l'on choisis les invités on passe à l'étape de sélection des repas
        actionCreator: orderingSlice.actions.chooseGuests,
        effect: (_, api) => {
          api.dispatch(orderingSlice.actions.setStep(OrderingDomainModel.OrderingStep.MEALS));
        }
      });

    listener.startListening({
        // Dés que l'on choisis un repas on passe à l'étape suivante (sommaire)
        actionCreator: orderingSlice.actions.chooseMeal,
        effect: (_, api) => {
            api.dispatch(orderingSlice.actions.setStep(OrderingDomainModel.OrderingStep.SUMMARY));
        }
    });

    listener.startListening({
        // Dés que l'on choisis le nombre d'invités en mode QR, on passe à l'étape de sélection des repas
        actionCreator: orderingSlice.actions.chooseQrGuestCount,
        effect: (_, api) => {
            api.dispatch(orderingSlice.actions.setStep(OrderingDomainModel.OrderingStep.MEALS));
        }
    });
}