"use client";

import { Card } from "@/components/ui/card";
import { useLandingLocale } from "../landing-locale-context";
import type { LandingKey } from "../landing-translations";

const capabilityKeys = [
  "capRealtimeAsr",
  "capBatch",
  "capAnnotations",
  "capClarifications",
  "capTranslations",
  "capFormatting",
] as const satisfies readonly LandingKey[];

export function LogoCarousel() {
  const { t } = useLandingLocale();
  const labels = capabilityKeys.map((k) => ({ key: k, label: t(k) }));

  return (
    <section className="pb-12 sm:pb-16 lg:pb-20 pt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-8 max-w-xl mx-auto text-balance">
            {t("stripIntro")}
          </p>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="overflow-hidden">
              <div className="flex animate-logo-scroll space-x-6 sm:space-x-10">
                {[...labels, ...labels].map((item, index) => (
                  <Card
                    key={`${item.key}-${index}`}
                    className="flex-shrink-0 flex items-center justify-center h-12 px-5 border bg-card/80 backdrop-blur-sm shadow-none"
                  >
                    <span className="text-foreground text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
