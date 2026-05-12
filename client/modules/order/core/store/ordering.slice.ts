import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type OrderingState = {
    step: OrderingDomainModel.OrderingStep,
    form: OrderingDomainModel.Form,
    restaurantId: OrderingDomainModel.RestaurantId,
    isTerminalMode: boolean;
    isQrMode: boolean;
    qrTableCapacity: number | null;
    qrError: string | null;
    selectedMenuId: string | null;
    existingOrder: OrderingDomainModel.ExistingOrder | null;
    availableTables: {
        data: OrderingDomainModel.Table[];
        status: 'idle' | 'loading' | 'success' | 'error';
        error: string | null;
    };
    availableMeals: {
        data: OrderingDomainModel.Meal[];
        status: 'idle' | 'loading' | 'success' | 'error';
        error: string | null;
    };
    availableMenus: {
        data: OrderingDomainModel.Menu[];
        status: 'idle' | 'loading' | 'success' | 'error';
        error: string | null;
    };
    reservation: ReservationStatus;
}

export type ReservationStatus =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; reservationCode: string }
    | { status: "error"; error: string }

export const initialState: OrderingState = {
    step: OrderingDomainModel.OrderingStep.RESTAURANT,
    form: {
        guests: [],
        organizerId: null,
        tableId: null
    },
    restaurantId: null,
    isTerminalMode: false,
    isQrMode: false,
    qrTableCapacity: null,
    qrError: null,
    selectedMenuId: null,
    existingOrder: null,
    availableTables: {
        status: 'idle',
        error: null,
        data: []
    },
    availableMeals: {
        status: 'idle',
        error: null,
        data: []
    },
    availableMenus: {
        status: 'idle',
        error: null,
        data: []
    },
    reservation: { status: "idle" }
}
// On va séparer les logiques et utiliser l'event driven dev (en version simplifiée) > voir store.ts
// On va rassembler a logique entière qui suit l'étape de choix de guest dans un autre endroit, dans un listener
// voir 'Gestion des étapes' 5.45s
export const orderingSlice = createSlice({
    name: 'ordering',
    initialState,
    reducers: {
        setStep: (state, action:PayloadAction<OrderingDomainModel.OrderingStep>) => {
            state.step = action.payload;
            // Version non-fonctionnel mais utile au début pour accéder juste à la section TABLE
            // state.step = OrderingDomainModel.OrderingStep.TABLE;
        },
        // Ici j'écris ce reducer suite à avoir écris le 4. de fetch-table.usecase.ts 
        // Ici pas besoin d'action car on ne fait que changer le status 
        // Aprés cette étape on doit retourner voir les test de 2. pour voir si ça passe
        handleTablesLoading: (state) => {
            state.availableTables.status = 'loading';
            state.availableTables.error = null;
        },
        // Ici j'écris ce reducer suite à avoir écris le 5. de fetch-table.usecase.ts
        // Ici on avait pas besoin d'action tant qu' on ne faisait que changer le status mais pour l'erreur on a besoin de l'action
        handleTablesError: (state, action: PayloadAction<string>) => {
            state.availableTables.status = 'error';
            state.availableTables.error = action.payload;
        },
        storeTables(state, action:PayloadAction<OrderingDomainModel.Table[]>){
            state.availableTables.data = action.payload;
            state.availableTables.status = 'success';
        },
        setRestaurantId: (state, action: PayloadAction<OrderingDomainModel.RestaurantId>) => {
            state.restaurantId = action.payload;
        },
        setTerminalMode: (state, action: PayloadAction<boolean>) => {
            state.isTerminalMode = action.payload;
        },
        chooseGuests: (state, action:PayloadAction<OrderingDomainModel.Form>) => {
            state.form = action.payload;
        },
        chooseTable: (state, action:PayloadAction<string>) => {
            state.form.tableId = action.payload;
            // Ne sert plus car on a créé un listener:
            // state.step = OrderingDomainModel.OrderingStep.MEALS;
        },
        handleMealsError: (state, action: PayloadAction<string>) => {
            state.availableMeals.status = 'error';
            state.availableMeals.error = action.payload;
        },
        storeMeals: (state, action:PayloadAction<OrderingDomainModel.Meal[]>) => {
            state.availableMeals.data = action.payload;
            state.availableMeals.status = 'success';
        },
        handleMealsLoading: (state) => {
            state.availableMeals.status = 'loading';
            state.availableMeals.error = null;
        },
        chooseMeal: (state, action:PayloadAction<OrderingDomainModel.Form>) => {
            state.form = action.payload;
        },
        handleReservationLoading: (state) => {
            state.reservation = {
                status: "loading"
            }
        },
        handleReservationError: (state) => {
            state.reservation = {
                status: "error",
                error: "Reservation failed"
            }
        },
        handleReservationSuccess: (state, action: PayloadAction<string>) => {
            state.reservation = {
                status: "success",
                reservationCode: action.payload
            }
            state.step = OrderingDomainModel.OrderingStep.RESERVED;
        },
        // Menu reducers
        handleMenusLoading: (state) => {
            state.availableMenus.status = 'loading';
            state.availableMenus.error = null;
        },
        handleMenusError: (state, action: PayloadAction<string>) => {
            state.availableMenus.status = 'error';
            state.availableMenus.error = action.payload;
        },
        storeMenus: (state, action: PayloadAction<OrderingDomainModel.Menu[]>) => {
            state.availableMenus.data = action.payload;
            state.availableMenus.status = 'success';
        },
        selectMenu: (state, action: PayloadAction<string | null>) => {
            state.selectedMenuId = action.payload;
        },
        // QR Mode reducers
        initQrMode: (state, action: PayloadAction<{ restaurantId: string; tableId: string }>) => {
            state.isQrMode = true;
            state.restaurantId = action.payload.restaurantId;
            state.form.tableId = action.payload.tableId;
            state.qrError = null;
        },
        setQrTableCapacity: (state, action: PayloadAction<number>) => {
            state.qrTableCapacity = action.payload;
        },
        setQrError: (state, action: PayloadAction<string>) => {
            state.qrError = action.payload;
            state.isQrMode = false;
        },
        clearQrMode: (state) => {
            state.isQrMode = false;
            state.qrTableCapacity = null;
            state.qrError = null;
        },
        chooseQrGuestCount: (state, action: PayloadAction<OrderingDomainModel.Form>) => {
            state.form = action.payload;
        },
        setExistingOrder: (state, action: PayloadAction<OrderingDomainModel.ExistingOrder | null>) => {
            state.existingOrder = action.payload;
        },
        clearExistingOrder: (state) => {
            state.existingOrder = null;
        }
    }
});

export const orderingReducer = orderingSlice.reducer;
export const orderingActions = orderingSlice.actions;




