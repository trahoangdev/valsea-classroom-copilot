"use client";

import Link from "next/link";
import { ArrowRight, Mic, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLandingLocale } from "../landing-locale-context";

export function CTASection() {
  const { t } = useLandingLocale();

  return (
    <section className="py-16 lg:py-24 bg-muted/80">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="space-y-8">
              <div className="flex flex-col items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <Mic className="size-3" />
                  {t("ctaBadge")}
                </Badge>

                <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    {t("ctaPillAsr")}
                  </span>
                  <Separator orientation="vertical" className="!h-4 hidden sm:block" />
                  <span>{t("ctaPillEndpoints")}</span>
                  <Separator orientation="vertical" className="!h-4 hidden sm:block" />
                  <span className="flex items-center gap-1">
                    <Shield className="size-3.5" />
                    {t("ctaPillGateway")}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  {t("ctaTitleBefore")}
                  <span className="relative mx-2 sm:mx-3">
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {t("ctaTitleHighlight")}
                    </span>
                    <span className="absolute start-0 -bottom-2 h-1 w-full bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full" />
                  </span>
                  {t("ctaTitleAfter")}
                </h2>

                <p className="text-muted-foreground mx-auto max-w-2xl text-balance lg:text-xl text-pretty">
                  {t("ctaLead")}
                </p>
              </div>

              <div className="flex flex-col justify-center gap-4 sm:flex-row sm:gap-6">
                <Button size="lg" className="cursor-pointer px-8 py-6 text-lg font-medium" asChild>
                  <Link href="/classroom-copilot">
                    <Mic className="me-2 size-5" />
                    {t("ctaPrimary")}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="cursor-pointer px-8 py-6 text-lg font-medium group"
                  asChild
                >
                  <Link href="#features">
                    {t("ctaSecondary")}
                    <ArrowRight className="ms-2 size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
