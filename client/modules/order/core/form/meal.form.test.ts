// Tests for MealForm with array-based meal selections
// Supports selecting multiple different items per category

import { MealForm } from "@taotask/modules/order/core/form/meal.form";
import { GuestFactory } from "@taotask/modules/order/core/model/guest.factory";
import { MealFactory } from "@taotask/modules/order/core/model/meal.factory";
import { OrderingDomainModel } from "@taotask/modules/order/core/model/ordering.domain-model";

const mealForm = new MealForm();

// Create guests for tests
const adult = GuestFactory.create({
    id: "1",
    firstName: "Randolf",
    lastName: "Verrin",
    age: 56,
    meals: { entries: [], mainCourses: [], desserts: [], drinks: [] }
});

const child = GuestFactory.create({
    id: '2',
    firstName: 'Arnaud',
    lastName: 'Dupont',
    age: 12,
    meals: { entries: [], mainCourses: [], desserts: [], drinks: [] }
});

// Create meals for tests
const adultDessert = MealFactory.create({
    id: '1', title: 'Tiramisu Alcoolisé', type: OrderingDomainModel.MealType.DESSERT, requiredAge: 18, price: 5
});

const regularDessert = MealFactory.create({
    id: '2', title: 'Tiramisu', type: OrderingDomainModel.MealType.DESSERT, requiredAge: 1, price: 5
});

const regularMainCourse = MealFactory.create({
    id: '3', title: 'Hamburger', type: OrderingDomainModel.MealType.MAIN_COURSE, requiredAge: 1, price: 5
});

const adultMainCourse = MealFactory.create({
    id: '4', title: 'Weed confit', type: OrderingDomainModel.MealType.MAIN_COURSE, requiredAge: 18, price: 5
});

const regularEntry = MealFactory.create({
    id: '5', title: 'Raita', type: OrderingDomainModel.MealType.ENTRY, requiredAge: 1, price: 5
});

const adultEntry = MealFactory.create({
    id: '6', title: 'Raita alcoolisée', type: OrderingDomainModel.MealType.ENTRY, requiredAge: 18, price: 5
});

const adultDrink = MealFactory.create({
    id: '7', title: 'Rhum', type: OrderingDomainModel.MealType.DRINK, requiredAge: 18, price: 5
});

const regularDrink = MealFactory.create({
    id: '8', title: 'Jus D\'Orange', type: OrderingDomainModel.MealType.DRINK, requiredAge: 1, price: 5
});

const meals: OrderingDomainModel.Meal[] = [
    regularMainCourse,
    adultMainCourse,
    regularEntry,
    adultEntry,
    adultDessert,
    regularDessert,
    adultDrink,
    regularDrink
];

describe('Getting Selectable Meals', () => {
    describe('When selecting an entry', () => {
        it.each([
            { meals: [], guest: adult, expected: [] },
            { meals, guest: adult, expected: [regularEntry, adultEntry] },
            { meals, guest: child, expected: [regularEntry] },
        ])(`returns correct entries based on age`, ({ meals, guest, expected }) => {
            const result = mealForm.getSelectableEntries(meals, guest);
            expect(result).toEqual(expected);
        });
    });

    describe('When selecting a main course', () => {
        it.each([
            { meals: [], guest: adult, expected: [] },
            { meals, guest: adult, expected: [regularMainCourse, adultMainCourse] },
            { meals, guest: child, expected: [regularMainCourse] },
        ])(`returns correct main courses based on age`, ({ meals, guest, expected }) => {
            const result = mealForm.getSelectableMainCourse(meals, guest);
            expect(result).toEqual(expected);
        });
    });

    describe('When selecting a dessert', () => {
        it.each([
            { meals: [], guest: adult, expected: [] },
            { meals, guest: adult, expected: [adultDessert, regularDessert] },
            { meals, guest: child, expected: [regularDessert] },
        ])(`returns correct desserts based on age`, ({ meals, guest, expected }) => {
            const result = mealForm.getSelectableDessert(meals, guest);
            expect(result).toEqual(expected);
        });
    });

    describe('When selecting a drink', () => {
        it.each([
            { meals: [], guest: adult, expected: [] },
            { meals, guest: adult, expected: [adultDrink, regularDrink] },
            { meals, guest: child, expected: [regularDrink] },
        ])(`returns correct drinks based on age`, ({ meals, guest, expected }) => {
            const result = mealForm.getSelectableDrink(meals, guest);
            expect(result).toEqual(expected);
        });
    });
});

describe('Toggle Meal Selection', () => {
    const form: OrderingDomainModel.Form = {
        guests: [adult, child],
        organizerId: adult.id,
        tableId: '1',
    };

    describe('When toggling an entry', () => {
        it('Should add entry when not selected', () => {
            const result = mealForm.toggleMealSelection(form, adult.id, regularEntry.id, OrderingDomainModel.MealType.ENTRY);
            expect(result.guests[0].meals.entries).toEqual([{ mealId: regularEntry.id, quantity: 1 }]);
        });

        it('Should remove entry when already selected', () => {
            const formWithEntry = {
                ...form,
                guests: [
                    { ...adult, meals: { ...adult.meals, entries: [{ mealId: regularEntry.id, quantity: 1 }] } },
                    child
                ]
            };
            const result = mealForm.toggleMealSelection(formWithEntry, adult.id, regularEntry.id, OrderingDomainModel.MealType.ENTRY);
            expect(result.guests[0].meals.entries).toEqual([]);
        });

        it('Should return unchanged form if guest not found', () => {
            const result = mealForm.toggleMealSelection(form, "non-existent", regularEntry.id, OrderingDomainModel.MealType.ENTRY);
            expect(result).toEqual(form);
        });
    });

    describe('When toggling a main course', () => {
        it('Should add main course when not selected', () => {
            const result = mealForm.toggleMealSelection(form, adult.id, regularMainCourse.id, OrderingDomainModel.MealType.MAIN_COURSE);
            expect(result.guests[0].meals.mainCourses).toEqual([{ mealId: regularMainCourse.id, quantity: 1 }]);
        });
    });

    describe('When toggling a dessert', () => {
        it('Should add dessert when not selected', () => {
            const result = mealForm.toggleMealSelection(form, adult.id, regularDessert.id, OrderingDomainModel.MealType.DESSERT);
            expect(result.guests[0].meals.desserts).toEqual([{ mealId: regularDessert.id, quantity: 1 }]);
        });
    });

    describe('When toggling a drink', () => {
        it('Should add drink when not selected', () => {
            const result = mealForm.toggleMealSelection(form, adult.id, regularDrink.id, OrderingDomainModel.MealType.DRINK);
            expect(result.guests[0].meals.drinks).toEqual([{ mealId: regularDrink.id, quantity: 1 }]);
        });
    });
});

describe('Update Meal Quantity', () => {
    const formWithMeals: OrderingDomainModel.Form = {
        guests: [{
            ...adult,
            meals: {
                entries: [{ mealId: regularEntry.id, quantity: 1 }],
                mainCourses: [{ mealId: regularMainCourse.id, quantity: 1 }],
                desserts: [],
                drinks: []
            }
        }],
        organizerId: adult.id,
        tableId: '1',
    };

    it('Should update quantity for existing meal', () => {
        const result = mealForm.updateMealQuantity(formWithMeals, adult.id, regularEntry.id, OrderingDomainModel.MealType.ENTRY, 3);
        expect(result.guests[0].meals.entries[0].quantity).toBe(3);
    });

    it('Should remove meal when quantity is 0', () => {
        const result = mealForm.updateMealQuantity(formWithMeals, adult.id, regularEntry.id, OrderingDomainModel.MealType.ENTRY, 0);
        expect(result.guests[0].meals.entries).toEqual([]);
    });

    it('Should not add meal if not present (use toggleMealSelection to add)', () => {
        const result = mealForm.updateMealQuantity(formWithMeals, adult.id, regularDessert.id, OrderingDomainModel.MealType.DESSERT, 2);
        // updateMealQuantity only updates existing meals, doesn't add new ones
        expect(result.guests[0].meals.desserts).toEqual([]);
    });
});

describe('Get Total Quantity For Type', () => {
    const guestWithMultipleMeals = GuestFactory.create({
        id: "1",
        meals: {
            entries: [
                { mealId: regularEntry.id, quantity: 1 },
                { mealId: adultEntry.id, quantity: 2 }
            ],
            mainCourses: [{ mealId: regularMainCourse.id, quantity: 1 }],
            desserts: [],
            drinks: []
        }
    });

    it('Should return sum of quantities for entry type', () => {
        const result = mealForm.getTotalQuantityForType(guestWithMultipleMeals, OrderingDomainModel.MealType.ENTRY);
        expect(result).toBe(3);
    });

    it('Should return 0 for empty type', () => {
        const result = mealForm.getTotalQuantityForType(guestWithMultipleMeals, OrderingDomainModel.MealType.DESSERT);
        expect(result).toBe(0);
    });
});

describe('Is Meal Selected', () => {
    const guestWithMeals = GuestFactory.create({
        id: "1",
        meals: {
            entries: [{ mealId: regularEntry.id, quantity: 1 }],
            mainCourses: [],
            desserts: [],
            drinks: []
        }
    });

    it('Should return true for selected meal', () => {
        const result = mealForm.isMealSelected(guestWithMeals, regularEntry.id, OrderingDomainModel.MealType.ENTRY);
        expect(result).toBe(true);
    });

    it('Should return false for non-selected meal', () => {
        const result = mealForm.isMealSelected(guestWithMeals, adultEntry.id, OrderingDomainModel.MealType.ENTRY);
        expect(result).toBe(false);
    });
});

describe('Get Meal Quantity', () => {
    const guestWithMeals = GuestFactory.create({
        id: "1",
        meals: {
            entries: [{ mealId: regularEntry.id, quantity: 3 }],
            mainCourses: [],
            desserts: [],
            drinks: []
        }
    });

    it('Should return quantity for selected meal', () => {
        const result = mealForm.getMealQuantity(guestWithMeals, regularEntry.id, OrderingDomainModel.MealType.ENTRY);
        expect(result).toBe(3);
    });

    it('Should return 0 for non-selected meal', () => {
        const result = mealForm.getMealQuantity(guestWithMeals, adultEntry.id, OrderingDomainModel.MealType.ENTRY);
        expect(result).toBe(0);
    });
});

describe('Submitable', () => {
    const isSubmitableForm: OrderingDomainModel.Form = {
        guests: [GuestFactory.create({
            meals: {
                entries: [],
                mainCourses: [{ mealId: regularMainCourse.id, quantity: 1 }],
                desserts: [],
                drinks: []
            }
        })],
        organizerId: adult.id,
        tableId: '1',
    };

    const isNotSubmitableForm: OrderingDomainModel.Form = {
        guests: [GuestFactory.create({
            meals: { entries: [], mainCourses: [], desserts: [], drinks: [] }
        })],
        organizerId: adult.id,
        tableId: '1',
    };

    it.each([
        { form: isSubmitableForm, expected: true },
        { form: isNotSubmitableForm, expected: false },
    ])(`returns correct submitable status`, ({ form, expected }) => {
        const result = mealForm.isSubmitable(form);
        expect(result).toEqual(expected);
    });
});
