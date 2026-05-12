import {AppState, useAppDispatch} from "@taotask/modules/store/store";
import {OrderingDomainModel} from "@taotask/modules/order/core/model/ordering.domain-model";
import {useSelector} from "react-redux";
import {orderingSlice} from "@taotask/modules/order/core/store/ordering.slice";
import { reserve } from "@taotask/modules/order/core/useCase/reserve.usecase";
import { useMemo } from 'react';

export type MealSummary = {
    id: string;
    title: string;
    price: number;
    quantity: number;
    requiredAge: number | null;
}

type GuestSummary = {
    id: string | number;
    name: string;
    isOrganizer: boolean;
    menuId: string | null;
    menuTitle: string | null;
    menuPrice: number | null;
    meals: {
        entries: MealSummary[];
        mainCourses: MealSummary[];
        desserts: MealSummary[];
        drinks: MealSummary[];
    }
}

type Summary = {
    table: {
        id: string;
        title: string;
    };
    guests: GuestSummary[];
};

const selectSummary = (state: AppState, menus: OrderingDomainModel.Menu[]): Summary => {
    const meals = state.ordering.availableMeals.data;

    function findMealById(id: string) {
        return meals.find((meal: OrderingDomainModel.Meal) => meal.id === id) ?? null;
    }

    function findMenuById(id: string) {
        return menus.find((menu: OrderingDomainModel.Menu) => menu.id === id) ?? null;
    }

    function mapSelections(selections: OrderingDomainModel.MealSelection[]): MealSummary[] {
        return selections
            .map(s => {
                const meal = findMealById(s.mealId);
                if (!meal) return null;
                return {
                    id: meal.id,
                    title: meal.title,
                    price: meal.price,
                    quantity: s.quantity,
                    requiredAge: meal.requiredAge
                };
            })
            .filter(Boolean) as MealSummary[];
    }

    const tableId = state.ordering.form.tableId;
    const table = state.ordering.availableTables.data.find((table: OrderingDomainModel.Table) =>
        tableId !== null && String(table.id) === String(tableId)
    );

    const organizerId = state.ordering.form.organizerId;
    const guests = state.ordering.form.guests.map((guest: OrderingDomainModel.Guest) => {
        const guestMenu = guest.menuId ? findMenuById(guest.menuId) : null;

        return {
            id: guest.id,
            name: `${guest.firstName} ${guest.lastName}`,
            isOrganizer: guest.id === organizerId,
            menuId: guest.menuId,
            menuTitle: guestMenu?.title || null,
            menuPrice: guestMenu?.price || null,
            meals: {
                entries: mapSelections(guest.meals.entries),
                mainCourses: mapSelections(guest.meals.mainCourses),
                desserts: mapSelections(guest.meals.desserts),
                drinks: mapSelections(guest.meals.drinks)
            }
        };
    });

    return {
        table: {
            id: table?.id ?? '',
            title: table?.title ?? 'Table non trouvée'
        },
        guests
    };
};

function calculateGuestMealsTotal(guestMeals: GuestSummary['meals']): number {
    const allMeals = [
        ...guestMeals.entries,
        ...guestMeals.mainCourses,
        ...guestMeals.desserts,
        ...guestMeals.drinks
    ];
    return allMeals.reduce((sum, meal) => sum + meal.price * meal.quantity, 0);
}

export const useSummary = () => {
    const dispatch = useAppDispatch();
    const menus = useSelector((state: AppState) => state.ordering.availableMenus.data);
    const isQrMode = useSelector((state: AppState) => state.ordering.isQrMode);
    const summary: Summary = useSelector((state: AppState) => selectSummary(state, menus));

    function onNext() {
        dispatch(reserve());
    }

    function onPrevious() {
        dispatch(orderingSlice.actions.setStep(OrderingDomainModel.OrderingStep.MEALS));
    }

    const totalPrice = useMemo(() => {
        const total = summary.guests.reduce((sum, guest) => {
            if (guest.menuId && guest.menuPrice) {
                return sum + guest.menuPrice;
            }
            return sum + calculateGuestMealsTotal(guest.meals);
        }, 0);
        return total.toFixed(2);
    }, [summary.guests]);

    const priceBreakdown = useMemo(() => {
        const menuGuests = summary.guests.filter(g => g.menuId);
        const alaCarteGuests = summary.guests.filter(g => !g.menuId);

        const menusByType = menuGuests.reduce((acc, guest) => {
            const key = guest.menuTitle || 'Menu';
            if (!acc[key]) acc[key] = { count: 0, price: guest.menuPrice || 0 };
            acc[key].count++;
            return acc;
        }, {} as Record<string, { count: number; price: number }>);

        const alaCarteTotal = alaCarteGuests.reduce(
            (sum, guest) => sum + calculateGuestMealsTotal(guest.meals),
            0
        );

        return { menusByType, alaCarteTotal, hasAlaCarte: alaCarteGuests.length > 0 };
    }, [summary.guests]);

    return {
        onNext,
        onPrevious,
        summary,
        totalPrice,
        priceBreakdown,
        isQrMode
    };
};
