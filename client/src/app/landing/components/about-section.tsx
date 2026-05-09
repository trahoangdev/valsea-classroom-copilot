"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CardDecorator } from "@/components/ui/card-decorator";
import { ArrowRight, BookOpen, Globe2, Shield } from "lucide-react";
import { useLandingLocale } from "../landing-locale-context";
import type { LandingKey } from "../landing-translations";

export function AboutSection() {
  const { t } = useLandingLocale();

  const values: {
    icon: typeof BookOpen;
    titleKey: LandingKey;
    descKey: LandingKey;
  }[] = [
    {
      icon: BookOpen,
      titleKey: "aboutCard1Title",
      descKey: "aboutCard1Body",
    },
    {
      icon: Globe2,
      titleKey: "aboutCard2Title",
      descKey: "aboutCard2Body",
    },
    {
      icon: Shield,
      titleKey: "aboutCard3Title",
      descKey: "aboutCard3Body",
    },
  ];

  return (
    <section id="about" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            {t("aboutBadge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6 text-balance">
            {t("aboutTitle")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 text-pretty">{t("aboutLead")}</p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3 mb-12">
          {values.map((value, index) => (
            <Card key={index} className="group shadow-xs py-2">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <CardDecorator>
                    <value.icon className="h-6 w-6" aria-hidden />
                  </CardDecorator>
                  <h3 className="mt-6 font-medium text-balance">{t(value.titleKey)}</h3>
                  <p className="text-muted-foreground mt-3 text-sm text-pretty">
                    {t(value.descKey)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button size="lg" className="cursor-pointer" asChild>
            <Link href="/classroom-copilot">
              {t("aboutCta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
