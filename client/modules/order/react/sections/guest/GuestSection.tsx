"use client";
import React from 'react';
import { useGuestSection } from "@taotask/modules/order/react/sections/guest/use-guest-section";
import { Trash2, Check } from "lucide-react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { OrderingDomainModel } from '@taotask/modules/order/core/model/ordering.domain-model';
import { LuminousCard } from '@taotask/modules/order/react/components/ui/LuminousCard';
import { LuminousButton } from '@taotask/modules/order/react/components/ui/LuminousButton';

export const GuestSection: React.FC<{
    restaurantList: OrderingDomainModel.RestaurantList;
    meals?: OrderingDomainModel.Meal[];
}> = ({restaurantList, meals = []}) => {
    const presenter:any = useGuestSection();

    const selectedRestaurant = restaurantList.restaurants.find(
        (restaurant: OrderingDomainModel.Restaurant) =>
            String(restaurant.id) === String(restaurantList.restaurantId)
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Guest Form Section */}
            <LuminousCard className="mx-auto py-8 sm:py-12 w-full max-w-[1200px] animate-fade-in-down">
                <div className="flex flex-col mx-auto mb-5 w-full">
                    {restaurantList.restaurantId ?
                        <>
                            <h2 className="mx-auto my-3 font-display font-medium text-luminous-text-primary text-xl sm:text-2xl text-center">
                                Qui voulez-vous inviter chez &quot;{selectedRestaurant?.restaurantName ?? 'votre restaurant'}&quot; ?
                            </h2>
                            {presenter.tableCapacity > 0 && (
                                <p className="text-center text-luminous-gold text-sm mb-2">
                                    Table de {presenter.tableCapacity} personne{presenter.tableCapacity > 1 ? 's' : ''}
                                </p>
                            )}
                        </> :
                        <h2 className="mx-auto my-3 font-display font-medium text-luminous-text-primary text-xl sm:text-2xl text-center">Pour inviter, choisissez un restaurant</h2>
                    }
                    <div className="h-1 w-16 bg-luminous-gold mx-auto my-4" />
                    <span className="mx-auto my-2 text-luminous-text-secondary text-sm sm:text-base italic text-center max-w-[600px]">Pour des raisons de sécurité, choisissez obligatoirement au moins un capitaine de soirée : l&#39;organisateur.</span>
                    <span className="mx-auto my-1 text-luminous-text-muted text-sm italic text-center max-w-[600px]">L&#39;organisateur est la personne qui ne boit pas et se charge du déplacement des invités.</span>
                </div>

                {restaurantList.restaurantId && presenter.form.guests.map((guest:any, index: number) => (
                    <div key={guest.id}>
                        <GuestRows
                            id={guest.id}
                            firstName={guest.firstName}
                            lastName={guest.lastName}
                            guestIndex={index}
                            age={guest.age}
                            onChange={presenter.updateGuest}
                            remove={presenter.removeGuest}
                            changeOrganizer={presenter.changeOrganizer}
                            isOrganizer={guest.id === presenter.form.organizerId}
                            checkboxRef={presenter.checkBoxOrganizer}
                        />
                    </div>
                ))}

                <div ref={presenter.bottomGuestRef} className="flex flex-col sm:flex-row justify-center gap-3 mx-auto w-full mt-6">
                    <LuminousButton
                        onClick={presenter.onPrevious}
                        variant="secondary"
                    >
                        Précédent
                    </LuminousButton>
                    <LuminousButton
                        onClick={presenter.addGuest}
                        variant="secondary"
                        disabled={presenter.isAddGuestDisabled}
                    >
                        + Inviter une personne
                        {presenter.tableCapacity > 0 && (
                            <span className="ml-2 text-xs">
                                ({presenter.form.guests.length}/{presenter.tableCapacity})
                            </span>
                        )}
                    </LuminousButton>
                    <LuminousButton
                        onClick={presenter.onNext}
                        disabled={presenter.isSubmitable === false}
                        variant="success"
                    >
                        Suivant
                    </LuminousButton>
                </div>
            </LuminousCard>
        </div>
    );
}


const GuestRows: React.FC<{
    id: string | number,
    firstName: string,
    lastName: string,
    guestIndex: number,
    age: number,
    isOrganizer: boolean,
    onChange: <T extends keyof OrderingDomainModel.Guest>
        (id:string | number,
        key:T,
        value: OrderingDomainModel.Guest[T]
        ) => void,
    remove: (id:string | number) => void,
    changeOrganizer: (id: string | number | null) => void
    checkboxRef: any
}> = ({id, firstName, lastName, guestIndex, age, onChange, remove, changeOrganizer, isOrganizer, checkboxRef}) => {
    const firstNameId = `guest-${id}-first-name`;
    const lastNameId = `guest-${id}-last-name`;
    const ageId = `guest-${id}-age`;
    const organizerLabelId = `guest-${id}-organizer-label`;
    const organizerMobileLabelId = `guest-${id}-organizer-label-mobile`;
    const guestNumber = guestIndex + 1;

    return (
    <div className="flex md:flex-row flex-col justify-center gap-3 mx-auto my-5 p-4 bg-luminous-bg-secondary rounded-lg border border-luminous-gold-border">

            <div className="relative flex flex-col justify-center items-center">
                <label className="block" htmlFor={firstNameId}>
                    <span className="block font-medium text-luminous-gold-muted text-xs uppercase tracking-wider mb-1">Prénom</span>
                        <input type="text"
                        id={firstNameId}
                        value={firstName}
                        placeholder={`Invité ${guestNumber}`}
                        className="block border-luminous-gold-border focus:border-luminous-gold bg-luminous-bg-card mt-1 px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-luminous-gold/30 w-full text-sm text-luminous-text-primary placeholder-luminous-text-muted focus:outline-none transition-all duration-200"
                        onChange= {(e) => onChange(id, 'firstName', e.target.value)}
                        />
                </label>
            </div>

            <div className="relative flex flex-col justify-center items-center">
                <label className="block" htmlFor={lastNameId}>
                    <span className="block font-medium text-luminous-gold-muted text-xs uppercase tracking-wider mb-1">Nom</span>
                        <input type="text"
                        id={lastNameId}
                        value={lastName}
                        placeholder="(optionnel)"
                        className="block border-luminous-gold-border focus:border-luminous-gold bg-luminous-bg-card mt-1 px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-luminous-gold/30 w-full text-sm text-luminous-text-primary placeholder-luminous-text-muted focus:outline-none transition-all duration-200"
                        min="0"
                        onChange= {(e) => onChange(id, "lastName", e.target.value)}
                        />
                </label>
            </div>


            <div className="relative flex flex-col justify-center items-center">
                <label className="block" htmlFor={ageId}>
                    <span className="block font-medium text-luminous-gold-muted text-xs uppercase tracking-wider mb-1">Age</span>
                        <input type="number"
                        id={ageId}
                        min="0"
                        value={age === 0 ? '' : age}
                        className="block border-luminous-gold-border focus:border-luminous-gold bg-luminous-bg-card mt-1 px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-luminous-gold/30 w-full text-sm text-luminous-text-primary placeholder-luminous-text-muted focus:outline-none transition-all duration-200"
                        placeholder="18"
                        onChange={(e) => onChange(id, 'age', Number(e.target.value))}
                        />
                </label>
            </div>

            <div className="relative md:flex flex-col justify-center items-center hidden">
                <span id={organizerLabelId} className="text-luminous-gold-muted text-xs uppercase tracking-wider mb-1">Organisateur</span>
                <Checkbox.Root
                    checked={isOrganizer}
                    onCheckedChange={(checked) => changeOrganizer(checked ? id : null)}
                    ref={checkboxRef}
                    className="bg-luminous-bg-card border-2 border-luminous-gold-border rounded-lg w-7 h-7 flex items-center justify-center data-[state=checked]:bg-luminous-gold data-[state=checked]:border-luminous-gold hover:border-luminous-gold transition-all duration-200"
                    aria-labelledby={organizerLabelId}
                >
                    <Checkbox.Indicator>
                        <Check className="w-4 h-4 text-white" aria-hidden="true" />
                    </Checkbox.Indicator>
                </Checkbox.Root>
            </div>
            <div className="relative md:flex flex-col justify-center items-center hidden">
                <span className="text-luminous-gold-muted text-xs uppercase tracking-wider mb-1 invisible">Suppr.</span>
                <button
                    className="flex items-center justify-center bg-luminous-bg-card border border-luminous-rose/30 hover:border-luminous-rose hover:bg-luminous-rose/10 p-2 rounded-lg transition-all duration-200 group"
                    onClick={() => remove(id)}
                    aria-label="Supprimer l'invité"
                >
                    <Trash2 className="w-4 h-4 text-luminous-rose" aria-hidden="true" />
                </button>
            </div>

            <div className="flex justify-between items-center md:hidden mx-auto w-full max-w-[220px] mt-2">
                <div className="flex items-center gap-2">
                    <Checkbox.Root
                        checked={isOrganizer}
                        onCheckedChange={(checked) => changeOrganizer(checked ? id : null)}
                        ref={checkboxRef}
                        className="bg-luminous-bg-card border-2 border-luminous-gold-border rounded-lg w-7 h-7 flex items-center justify-center data-[state=checked]:bg-luminous-gold data-[state=checked]:border-luminous-gold hover:border-luminous-gold transition-all duration-200"
                        aria-labelledby={organizerMobileLabelId}
                    >
                        <Checkbox.Indicator>
                            <Check className="w-4 h-4 text-white" aria-hidden="true" />
                        </Checkbox.Indicator>
                    </Checkbox.Root>
                    <span id={organizerMobileLabelId} className="text-luminous-gold-muted text-xs uppercase tracking-wider">J&#39;organise</span>
                </div>
                <button
                    className="flex items-center justify-center bg-luminous-bg-card border border-luminous-rose/30 hover:border-luminous-rose hover:bg-luminous-rose/10 p-2 rounded-lg transition-all duration-200"
                    onClick={() => remove(id)}
                    aria-label="Supprimer l'invité"
                >
                    <Trash2 className="w-4 h-4 text-luminous-rose" aria-hidden="true" />
                </button>
            </div>
    </div>
    )
}
