export namespace OrderingDomainModel {
    
    export type Form = {
        guests: Guest[],
        organizerId: string | number | null,
        tableId: string | null
    }

    export type MealId = string;
    export type RestaurantId = string | number | null;

    export type MealSelection = {
        mealId: MealId;
        quantity: number;
    }

    export enum MealType {
        ENTRY = "ENTRY",
        MAIN_COURSE = "MAIN_COURSE",
        DESSERT = "DESSERT",
        DRINK = "DRINK"
    }

    export type Meal = {
        id: MealId,
        restaurantId: RestaurantId,
        title: string,
        type: MealType,
        price: number,
        requiredAge: number | null,
        imageUrl: string
    }

    export type MenuItem = {
        mealType: MealType;
        quantity: number;
    }

    export type Menu = {
        id: string;
        restaurantId: RestaurantId;
        title: string;
        description: string;
        price: number;
        imageUrl: string;
        items: MenuItem[];
    }

    export type Guest = {
        id: string | number,
        firstName: string,
        lastName: string,
        age: number,
        meals: {
            entries: MealSelection[],
            mainCourses: MealSelection[],
            desserts: MealSelection[],
            drinks: MealSelection[]
        }
        restaurantId: RestaurantId,
        isOrganizer: boolean,
        menuId: string | null
    }

    export type RestaurantList = {
        restaurants: Restaurant[],
        restaurantId: RestaurantId 
    }

    export type Restaurant = {
        id: string | number, 
        restaurantName: string,
        restaurantType: string,
        stars: number
    }

    export enum OrderingStep {
        RESTAURANT = 0,
        MEALS_PREVIEW = 1,
        TABLE = 2,
        GUESTS = 3,
        MEALS = 4,
        SUMMARY = 5,
        RESERVED = 6,
        QR_GUESTS = 7,
        EXISTING_ORDER = 8
    }

    export type ExistingOrder = {
        id: number;
        reservationCode: string;
        status: string;
        guestCount: number;
    }

    export type Table = {
        id: string, 
        title: string,
        capacity: number
    }
   
}
