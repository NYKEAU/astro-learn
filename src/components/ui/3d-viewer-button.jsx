"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import { Lock, Loader2 } from "lucide-react";

export function ThreeDViewerButton({
    onClick,
    isActive = false,
    isLoading = false,
    hasAccess = true,
    language,
    className = "",
    ...restProps
}) {
    // Filtrer les props personnalisées pour ne pas les passer au DOM
    const {
        isLoading: _isLoading,
        hasAccess: _hasAccess,
        language: _language,
        ...domProps
    } = restProps;

    return (
        <Button
            onClick={onClick}
            disabled={isLoading}
            className={`
        bg-gradient-to-r from-neon-blue to-neon-pink 
        hover:opacity-90 text-lunar-white font-medium 
        px-4 py-2 md:px-6 md:py-3 
        rounded-lg transition-all duration-300 
        flex items-center gap-2 
        shadow-lg hover:shadow-neon-blue/25 
        button-glow
        text-sm md:text-base
        ${isActive ? 'opacity-90 shadow-neon-blue/40' : ''}
        ${!hasAccess ? 'opacity-60' : ''}
        ${className}
      `}
            aria-label={language === "fr" ? "Découvrir en 3D" : "Discover in 3D"}
            {...domProps}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 animate-spin" />
            ) : !hasAccess ? (
                <Lock className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
            ) : (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                </svg>
            )}
            <span className="hidden sm:inline">
                {isLoading
                    ? (language === "fr" ? "Chargement..." : "Loading...")
                    : !hasAccess
                        ? (language === "fr" ? "Accès restreint" : "Restricted access")
                        : (language === "fr" ? "Découvrir en 3D" : "Discover in 3D")
                }
            </span>
            <span className="sm:hidden">
                {isLoading ? "..." : !hasAccess ? "🔒" : "3D"}
            </span>
        </Button>
    );
} 