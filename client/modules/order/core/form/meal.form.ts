import { OrderingDomainModel } from '@bugbountyapp/modules/ordering/domain/ordering.domain-model';
import { produce } from 'immer';

export class MealForm {

    private isMealType(meal: OrderingDomainModel.Meal, type: OrderingDomainModel.MealType) {
        return meal.type === type;
    }

    private hasRequiredAge(meal: OrderingDomainModel.Meal, guest: OrderingDomainModel.Guest) {
        if(meal.requiredAge === null) {
            return true;
        }
        return guest.age >= meal.requiredAge;
    }

    getSelectableEntries(
        meals: OrderingDomainModel.Meal[],
        guest: OrderingDomainModel.Guest
    ) {
        return meals.filter(meal =>
            this.isMealType(meal, OrderingDomainModel.MealType.ENTRY) &&
            this.hasRequiredAge(meal, guest)
        );
    }

    getSelectableMainCourse(
        meals: OrderingDomainModel.Meal[],
        guest: OrderingDomainModel.Guest
    ) {
        return meals.filter(meal =>
            this.isMealType(meal, OrderingDomainModel.MealType.MAIN_COURSE) &&
            this.hasRequiredAge(meal, guest)
        );
    }

    getSelectableDessert(
        meals: OrderingDomainModel.Meal[],
        guest: OrderingDomainModel.Guest
    ) {
        return meals.filter(meal =>
            this.isMealType(meal, OrderingDomainModel.MealType.DESSERT) &&
            this.hasRequiredAge(meal, guest)
        );
    }

    getSelectableDrink(
        meals: OrderingDomainModel.Meal[],
        guest: OrderingDomainModel.Guest
    ) {
        return meals.filter(meal =>
            this.isMealType(meal, OrderingDomainModel.MealType.DRINK) &&
            this.hasRequiredAge(meal, guest)
        );
    }

    private getMealsArrayKey(mealType: OrderingDomainModel.MealType): keyof OrderingDomainModel.Guest['meals'] {
        switch (mealType) {
            case OrderingDomainModel.MealType.ENTRY: return 'entries';
            case OrderingDomainModel.MealType.MAIN_COURSE: return 'mainCourses';
            case OrderingDomainModel.MealType.DESSERT: return 'desserts';
            case OrderingDomainModel.MealType.DRINK: return 'drinks';
        }
    }

    /**
     * Toggle a meal selection: if already selected, remove it; otherwise add it with quantity 1
     */
    toggleMealSelection(
        form: OrderingDomainModel.Form,
        guestId: string | number,
        mealId: OrderingDomainModel.MealId,
        mealType: OrderingDomainModel.MealType
    ) {
        return produce(form, draft => {
            const guest = draft.guests.find(g => g.id === guestId);
            if (!guest) return;

            const key = this.getMealsArrayKey(mealType);
            const selections = guest.meals[key] as OrderingDomainModel.MealSelection[];
            const existingIndex = selections.findIndex(s => s.mealId === mealId);

            if (existingIndex >= 0) {
                // Remove if already selected
                selections.splice(existingIndex, 1);
            } else {
                // Add with quantity 1
                selections.push({ mealId, quantity: 1 });
            }
        });
    }

    /**
     * Update the quantity of a specific meal selection
     */
    updateMealQuantity(
        form: OrderingDomainModel.Form,
        guestId: string | number,
        mealId: OrderingDomainModel.MealId,
        mealType: OrderingDomainModel.MealType,
        quantity: number
    ) {
        return produce(form, draft => {
            const guest = draft.guests.find(g => g.id === guestId);
            if (!guest) return;

            const key = this.getMealsArrayKey(mealType);
            const selections = guest.meals[key] as OrderingDomainModel.MealSelection[];
            const existingIndex = selections.findIndex(s => s.mealId === mealId);

            if (existingIndex >= 0) {
                if (quantity <= 0) {
                    // Remove if quantity is 0 or less
                    selections.splice(existingIndex, 1);
                } else {
                    selections[existingIndex].quantity = quantity;
                }
            }
        });
    }

    /**
     * Get total quantity selected for a meal type
     */
    getTotalQuantityForType(guest: OrderingDomainModel.Guest, mealType: OrderingDomainModel.MealType): number {
        const key = this.getMealsArrayKey(mealType);
        const selections = guest.meals[key] as OrderingDomainModel.MealSelection[];
        return selections.reduce((sum, s) => sum + s.quantity, 0);
    }

    /**
     * Get quantity for a specific meal
     */
    getMealQuantity(guest: OrderingDomainModel.Guest, mealId: string, mealType: OrderingDomainModel.MealType): number {
        const key = this.getMealsArrayKey(mealType);
        const selections = guest.meals[key] as OrderingDomainModel.MealSelection[];
        const selection = selections.find(s => s.mealId === mealId);
        return selection?.quantity ?? 0;
    }

    /**
     * Check if a meal is selected
     */
    isMealSelected(guest: OrderingDomainModel.Guest, mealId: string, mealType: OrderingDomainModel.MealType): boolean {
        const key = this.getMealsArrayKey(mealType);
        const selections = guest.meals[key] as OrderingDomainModel.MealSelection[];
        return selections.some(s => s.mealId === mealId);
    }

    /**
     * Clear all meals for a specific type
     */
    clearMealsForType(
        form: OrderingDomainModel.Form,
        guestId: string | number,
        mealType: OrderingDomainModel.MealType
    ) {
        return produce(form, draft => {
            const guest = draft.guests.find(g => g.id === guestId);
            if (!guest) return;

            const key = this.getMealsArrayKey(mealType);
            (guest.meals[key] as OrderingDomainModel.MealSelection[]).length = 0;
        });
    }

    isSubmitable(state: OrderingDomainModel.Form) {
        // At least one main course must be selected for each guest
        return state.guests.every(guest => guest.meals.mainCourses.length > 0);
    }
}
