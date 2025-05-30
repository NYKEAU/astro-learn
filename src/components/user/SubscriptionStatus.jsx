"use client";

import { useAuth } from "@/app/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/LanguageContext";
import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import { Crown, Unlock } from "lucide-react";

export function SubscriptionStatus() {
    const { t, language } = useLanguage();
    const { user, role, isPremium, premiumUntil, unlockedModules } = useAuth();

    // Si l'utilisateur n'est pas connecté, ne rien afficher
    if (!user) return null;

    // Formater la date d'expiration pour l'affichage
    const formatExpiryDate = (date) => {
        if (!date) return null;

        const expiryDate = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();

        const options = {
            locale: language === 'fr' ? fr : undefined
        };

        return formatDistance(expiryDate, now, {
            addSuffix: true,
            ...options
        });
    };

    return (
        <Card className="bg-black/20 backdrop-blur-lg border-neon-blue/30 shadow-cosmic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-neon-blue">
                    {isPremium ? (
                        <>
                            <Crown className="h-5 w-5 text-amber-400" />
                            {language === 'fr' ? 'Abonnement Premium' : 'Premium Subscription'}
                        </>
                    ) : (
                        <>
                            <Unlock className="h-5 w-5" />
                            {language === 'fr' ? 'Compte Gratuit' : 'Free Account'}
                        </>
                    )}
                </CardTitle>
                <CardDescription>
                    {isPremium
                        ? (language === 'fr'
                            ? `Votre abonnement premium expire ${formatExpiryDate(premiumUntil)}`
                            : `Your premium subscription expires ${formatExpiryDate(premiumUntil)}`)
                        : (language === 'fr'
                            ? "Débloquez tous les modules avec un abonnement premium"
                            : "Unlock all modules with a premium subscription")}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-lunar-white/70">
                            {language === 'fr' ? 'Statut actuel' : 'Current status'}:
                        </span>
                        <Badge variant={isPremium ? "default" : "outline"} className={isPremium ? "bg-amber-500/80" : ""}>
                            {role === 'premium'
                                ? (language === 'fr' ? 'Premium' : 'Premium')
                                : (language === 'fr' ? 'Gratuit' : 'Free')}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-lunar-white/70">
                            {language === 'fr' ? 'Modules débloqués' : 'Unlocked modules'}:
                        </span>
                        <span className="font-semibold">
                            {isPremium
                                ? (language === 'fr' ? 'Tous' : 'All')
                                : unlockedModules?.length || 0}
                        </span>
                    </div>
                </div>
            </CardContent>

            <CardFooter>
                {!isPremium && (
                    <Button className="w-full bg-gradient-to-r from-neon-blue to-purple-600 hover:from-neon-blue hover:to-purple-700 border-none">
                        {language === 'fr' ? 'Passer à Premium' : 'Upgrade to Premium'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
} 