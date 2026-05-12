"use client";
import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { LuminousCard } from '@taotask/modules/order/react/components/ui/LuminousCard';
import { LuminousButton } from '@taotask/modules/order/react/components/ui/LuminousButton';
import { useQrGuestSection } from './use-qr-guest-section.hook';

export const QrGuestSection: React.FC = () => {
    const presenter = useQrGuestSection();

    return (
        <div className="flex flex-col gap-6">
            <LuminousCard className="mx-auto py-8 sm:py-12 w-full max-w-[600px] animate-fade-in-down">
                <div className="flex flex-col items-center text-center">
                    <h2 className="font-display font-medium text-luminous-text-primary text-2xl sm:text-3xl mb-2">
                        Combien de personnes ?
                    </h2>
                    <p className="text-luminous-gold text-sm mb-8">
                        Table de {presenter.maxGuests} place{presenter.maxGuests > 1 ? 's' : ''}
                    </p>
                    <div className="h-1 w-16 bg-luminous-gold mx-auto mb-8" />

                    <div className="flex items-center gap-6 mb-10">
                        <button
                            onClick={presenter.decrement}
                            disabled={!presenter.canDecrement}
                            className="w-14 h-14 rounded-full border-2 border-luminous-gold-border flex items-center justify-center
                                     bg-luminous-bg-card text-luminous-gold
                                     hover:border-luminous-gold hover:bg-luminous-gold-glow
                                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-luminous-gold-border disabled:hover:bg-luminous-bg-card
                                     transition-all duration-200"
                            aria-label="Diminuer le nombre d'invités"
                        >
                            <Minus className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col items-center">
                            <span className="text-5xl sm:text-6xl font-display font-bold text-luminous-gold">
                                {presenter.guestCount}
                            </span>
                            <span className="text-luminous-text-muted text-sm mt-1">
                                {presenter.guestCount === 1 ? 'personne' : 'personnes'}
                            </span>
                        </div>

                        <button
                            onClick={presenter.increment}
                            disabled={!presenter.canIncrement}
                            className="w-14 h-14 rounded-full border-2 border-luminous-gold-border flex items-center justify-center
                                     bg-luminous-bg-card text-luminous-gold
                                     hover:border-luminous-gold hover:bg-luminous-gold-glow
                                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-luminous-gold-border disabled:hover:bg-luminous-bg-card
                                     transition-all duration-200"
                            aria-label="Augmenter le nombre d'invités"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>

                    <LuminousButton
                        onClick={presenter.onSubmit}
                        variant="success"
                        className="min-w-[200px]"
                    >
                        Commander
                    </LuminousButton>
                </div>
            </LuminousCard>
        </div>
    );
};
