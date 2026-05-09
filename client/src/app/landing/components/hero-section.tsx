"use client";

import Link from "next/link";
import { ArrowRight, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DotPattern } from "@/components/dot-pattern";
import { useLandingLocale } from "../landing-locale-context";
import { HeroMockPreview } from "./hero-mock-preview";

export function HeroSection() {
  const { t } = useLandingLocale();

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-background to-background/80 pt-16 sm:pt-20 pb-16"
    >
      <div className="absolute inset-0">
        <DotPattern className="opacity-100" size="md" fadeStyle="ellipse" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <Badge variant="outline" className="px-4 py-2 border-foreground gap-2">
              <Sparkles className="w-3 h-3" />
              {t("heroBadge")}
            </Badge>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
            {t("heroTitleBefore")}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {" "}
              {t("heroTitleHighlight")}
            </span>
          </h1>

          <p className="mx-auto mb-4 max-w-2xl text-lg text-muted-foreground sm:text-xl text-pretty">
            {t("heroLead")}
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-sm text-muted-foreground">{t("heroSub")}</p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="text-base cursor-pointer" asChild>
              <Link href="/classroom-copilot">
                <Mic className="mr-2 h-4 w-4" />
                {t("heroCtaPrimary")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-base cursor-pointer" asChild>
              <a href="#features">{t("heroCtaSecondary")}</a>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <HeroMockPreview
            transcriptLabel={t("heroMockTranscriptLabel")}
            listeningLabel={t("heroMockListening")}
            line1={t("heroMockLine1")}
            line2={t("heroMockLine2")}
            assistantLabel={t("heroMockAssistantLabel")}
            assistantBadge={t("heroMockAssistantBadge")}
            bullets={[t("heroMockBullet1"), t("heroMockBullet2"), t("heroMockBullet3")]}
          />
        </div>
      </div>
    </section>
  );
}
