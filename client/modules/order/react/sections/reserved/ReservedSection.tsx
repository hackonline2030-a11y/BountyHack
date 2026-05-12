import { useReserved } from './use-reserved.hook';
import { LuminousCard } from '@taotask/modules/order/react/components/ui/LuminousCard';
import { LuminousButton } from '@taotask/modules/order/react/components/ui/LuminousButton';
import { CheckCircle, QrCode } from 'lucide-react';

type ModeType = 'terminal' | 'qr' | 'standard';

const MESSAGES: Record<ModeType, { title: string; body: string; footer: string }> = {
    terminal: {
        title: "Un membre de notre équipe va vous accueillir",
        body: "Veuillez patienter, un membre de notre équipe viendra vous placer à votre table.",
        footer: "Merci de votre patience."
    },
    qr: {
        title: "Votre commande a été envoyée",
        body: "Votre commande a été transmise en cuisine.",
        footer: "Bon appétit !"
    },
    standard: {
        title: "Merci pour votre réservation",
        body: "En réservant chez nous, vous pouvez vous attendre à un service de qualité et à un restaurant convivial.",
        footer: "Nous vous remercions de votre confiance et nous espérons vous revoir bientôt."
    }
};

export const ReservedSection = () => {
    const presenter = useReserved();

    const mode: ModeType = presenter.isTerminalMode ? 'terminal' 
        : presenter.isQrMode ? 'qr' 
        : 'standard';
    const messages = MESSAGES[mode];
    const showReservationCode = mode === 'standard' && presenter.reservationCode;
    const showActions = mode !== 'qr';

    return (
    <LuminousCard className="mx-auto py-8 sm:py-12 w-full max-w-[1200px] animate-fade-in-down">
        <div className="flex flex-col mx-auto mb-6 w-full items-center">
            <div className="w-16 h-16 rounded-full bg-luminous-sage/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-luminous-sage" />
            </div>
            <h3 className="mx-auto my-3 font-display font-medium text-luminous-text-primary text-xl sm:text-2xl text-center">
                {messages.title}
            </h3>
            <div className="h-1 w-16 bg-luminous-gold mx-auto my-4" />
        </div>

        {showReservationCode && (
            <div className="flex flex-col mx-auto mb-8">
                <div className="bg-luminous-bg-secondary border-2 border-luminous-gold mx-auto px-6 sm:px-10 py-6 sm:py-8 rounded-xl w-full max-w-[600px]">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <QrCode className="w-6 h-6 text-luminous-gold" />
                        <p className="text-luminous-text-secondary text-sm">
                            Votre code de réservation
                        </p>
                    </div>
                    <p className="text-4xl sm:text-5xl font-bold text-luminous-gold tracking-wider text-center mb-4">
                        {presenter.reservationCode}
                    </p>
                    <p className="text-sm text-center text-luminous-text-muted">
                        Conservez ce code pour le terminal à votre arrivée
                    </p>
                </div>
            </div>
        )}

        <div className="flex flex-col mx-auto mb-8">
            <div className="bg-luminous-bg-secondary border border-luminous-gold-border mx-auto px-6 sm:px-10 py-6 sm:py-8 rounded-xl w-full max-w-[600px]">
                <p className="mb-3 text-sm sm:text-base text-center text-luminous-text-secondary">
                    {messages.body}
                </p>
                {mode === 'standard' && (
                    <p className="mb-3 text-sm sm:text-base text-center text-luminous-text-secondary">
                        Notre équipe met tout en œuvre pour vous offrir une expérience culinaire exceptionnelle.
                    </p>
                )}
                <p className="text-sm sm:text-base text-center text-luminous-gold font-medium">
                    {messages.footer}
                </p>
            </div>
        </div>

        {showActions && (
            <div className="flex flex-col sm:flex-row justify-center gap-3 mx-auto w-full">
                <LuminousButton
                    onClick={presenter.onNewTable}
                    variant="primary"
                >
                    Nouvelle réservation
                </LuminousButton>
                {mode === 'standard' && (
                    <a
                        href="/"
                        className="
                            px-6 py-3 rounded-lg font-medium uppercase tracking-wider text-sm text-center
                            transition-all duration-200 ease-in-out
                            bg-transparent border border-luminous-gold text-luminous-gold
                            hover:bg-luminous-gold-glow
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-luminous-bg-primary focus:ring-luminous-gold/30
                        "
                    >
                        Retour Accueil
                    </a>
                )}
            </div>
        )}
    </LuminousCard>
    )
}
