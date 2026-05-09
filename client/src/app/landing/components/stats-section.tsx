"use client";

import type { LucideIcon } from "lucide-react";
import { AudioWaveform, Brain, Server, Waypoints } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DotPattern } from "@/components/dot-pattern";
import { useLandingLocale } from "../landing-locale-context";
import type { LandingKey } from "../landing-translations";

type StatRow =
  | { icon: LucideIcon; value: string; labelKey: LandingKey; descKey: LandingKey }
  | { icon: LucideIcon; valueKey: LandingKey; labelKey: LandingKey; descKey: LandingKey };

const statRows: StatRow[] = [
  {
    icon: Waypoints,
    value: "6",
    labelKey: "statEndpointsMainLabel",
    descKey: "statEndpointsDesc",
  },
  {
    icon: AudioWaveform,
    value: "16 kHz",
    labelKey: "statPcmLabel",
    descKey: "statPcmDesc",
  },
  {
    icon: Server,
    valueKey: "statGatewayValue",
    labelKey: "statGatewayLabel",
    descKey: "statGatewayDesc",
  },
  {
    icon: Brain,
    valueKey: "statAssistValue",
    labelKey: "statAssistLabel",
    descKey: "statAssistDesc",
  },
];

export function StatsSection() {
  const { t } = useLandingLocale();

  return (
    <section className="py-12 sm:py-16 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-secondary/20" />
      <DotPattern className="opacity-75" size="md" fadeStyle="circle" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {statRows.map((stat, index) => {
            const value = "value" in stat ? stat.value : t(stat.valueKey);
            return (
              <Card
                key={index}
                className="text-center bg-background/60 backdrop-blur-sm border-border/50 py-0"
              >
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{value}</h3>
                    <p className="font-semibold text-foreground">{t(stat.labelKey)}</p>
                    <p className="text-sm text-muted-foreground">{t(stat.descKey)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
