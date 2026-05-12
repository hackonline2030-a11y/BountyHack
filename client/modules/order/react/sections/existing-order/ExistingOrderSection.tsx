"use client";
import React from 'react';
import { ClipboardList, PlusCircle, ChefHat } from 'lucide-react';
import { LuminousCard } from '@taotask/modules/order/react/components/ui/LuminousCard';
import { LuminousButton } from '@taotask/modules/order/react/components/ui/LuminousButton';
import { useExistingOrder } from './use-existing-order.hook';

export const ExistingOrderSection: React.FC = () => {
    const presenter = useExistingOrder();

    if (!presenter.existingOrder) {
        return null;
    }

    const statusLabels: Record<string, string> = {
        SEATED: 'En attente',
        IN_PREPARATION: 'En preparation',
    };

    const statusLabel = statusLabels[presenter.existingOrder.status] || presenter.existingOrder.status;
    const isAlreadyLaunched = presenter.existingOrder.status === 'IN_PREPARATION';

    return (
        <div className="flex flex-col gap-6">
            <LuminousCard className="mx-auto py-8 sm:py-12 w-full max-w-[600px] animate-fade-in-down">
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-luminous-gold-glow flex items-center justify-center mb-6">
                        <ClipboardList className="w-10 h-10 text-luminous-gold" />
                    </div>

                    <h2 className="font-display font-medium text-luminous-text-primary text-2xl sm:text-3xl mb-2">
                        Commande en cours
                    </h2>
                    <p className="text-luminous-text-muted text-sm mb-4">
                        Une commande est deja active sur cette table
                    </p>

                    <div className="h-1 w-16 bg-luminous-gold mx-auto mb-6" />

                    <div className="bg-luminous-bg-card-alt rounded-lg p-4 mb-8 w-full max-w-[300px]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-luminous-text-muted text-sm">Code</span>
                            <span className="font-mono font-bold text-luminous-gold">
                                {presenter.existingOrder.reservationCode}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-luminous-text-muted text-sm">Convives</span>
                            <span className="text-luminous-text-primary">
                                {presenter.existingOrder.guestCount}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-luminous-text-muted text-sm">Statut</span>
                            <span className="text-luminous-teal">
                                {statusLabel}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[400px]">
                        <LuminousButton
                            onClick={presenter.onAddMoreItems}
                            variant="secondary"
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Ajouter des plats
                        </LuminousButton>

                        <LuminousButton
                            onClick={presenter.onLaunchOrder}
                            variant="success"
                            disabled={presenter.isLaunching || isAlreadyLaunched}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <ChefHat className="w-5 h-5" />
                            {isAlreadyLaunched ? 'Deja lancee' : presenter.isLaunching ? 'Envoi...' : 'Lancer la commande'}
                        </LuminousButton>
                    </div>
                </div>
            </LuminousCard>
        </div>
    );
};
