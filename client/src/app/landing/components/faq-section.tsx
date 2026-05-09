"use client";

import { useMemo } from "react";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useLandingLocale } from "../landing-locale-context";
import type { LandingKey } from "../landing-translations";

const FaqSection = () => {
  const { t } = useLandingLocale();

  const faqItems = useMemo(
    () =>
      [
        { value: "item-1", qKey: "faq1q" as const, aKey: "faq1a" as const },
        { value: "item-2", qKey: "faq2q" as const, aKey: "faq2a" as const },
        { value: "item-3", qKey: "faq3q" as const, aKey: "faq3a" as const },
        { value: "item-4", qKey: "faq4q" as const, aKey: "faq4a" as const },
        { value: "item-5", qKey: "faq5q" as const, aKey: "faq5a" as const },
        { value: "item-6", qKey: "faq6q" as const, aKey: "faq6a" as const },
      ] satisfies { value: string; qKey: LandingKey; aKey: LandingKey }[],
    [],
  );

  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            {t("faqBadge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-balance">
            {t("faqTitle")}
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">{t("faqSubtitle")}</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-transparent">
            <div className="p-0">
              <Accordion type="single" collapsible className="space-y-5">
                {faqItems.map((item) => (
                  <AccordionItem
                    key={item.value}
                    value={item.value}
                    className="rounded-md !border bg-transparent"
                  >
                    <AccordionTrigger className="cursor-pointer items-center gap-4 rounded-none bg-transparent py-2 ps-3 pe-4 hover:no-underline data-[state=open]:border-b">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                          <CircleHelp className="size-5" />
                        </div>
                        <span className="text-start font-semibold">{t(item.qKey)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-transparent text-muted-foreground text-pretty">
                      {t(item.aKey)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">{t("faqSupport")}</p>
            <Button className="cursor-pointer" asChild>
              <a href="#contact">{t("faqContact")}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export { FaqSection };
