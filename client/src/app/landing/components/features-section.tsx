"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileAudio,
  Languages,
  ListTree,
  MessageCircleQuestion,
  Mic2,
  ScanText,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLandingLocale } from "../landing-locale-context";
import type { LandingKey } from "../landing-translations";

export function FeaturesSection() {
  const { t } = useLandingLocale();

  const endpoints: {
    icon: typeof Mic2;
    title: string;
    descKey: LandingKey;
  }[] = [
    { icon: Mic2, title: "Realtime ASR", descKey: "featRealtimeDesc" },
    { icon: FileAudio, title: "Batch transcription", descKey: "featBatchDesc" },
    { icon: Tags, title: "Annotations", descKey: "featAnnotDesc" },
    { icon: MessageCircleQuestion, title: "Clarifications", descKey: "featClarifyDesc" },
    { icon: Languages, title: "Translations", descKey: "featTranslateDesc" },
    { icon: ListTree, title: "Formatting", descKey: "featFormatDesc" },
  ];

  const workflow: { step: string; titleKey: LandingKey; bodyKey: LandingKey }[] = [
    { step: "01", titleKey: "featWf1Title", bodyKey: "featWf1Body" },
    { step: "02", titleKey: "featWf2Title", bodyKey: "featWf2Body" },
    { step: "03", titleKey: "featWf3Title", bodyKey: "featWf3Body" },
  ];

  return (
    <section id="features" className="py-24 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            {t("featBadge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-balance">
            {t("featTitle")}
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">{t("featLead")}</p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-20">
          {endpoints.map((item) => (
            <Card key={item.title} className="border-border/80 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <item.icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle className="text-base font-semibold leading-snug">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-pretty">{t(item.descKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <ScanText className="size-5 text-primary" />
            <h3 className="text-xl font-semibold text-center sm:text-2xl">{t("featFlowTitle")}</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {workflow.map((w) => (
              <Card key={w.step} className="bg-background/80">
                <CardContent className="pt-6">
                  <p className="text-xs font-mono text-primary mb-2">{w.step}</p>
                  <p className="font-medium mb-2">{t(w.titleKey)}</p>
                  <p className="text-sm text-muted-foreground text-pretty">{t(w.bodyKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <Button size="lg" className="cursor-pointer" asChild>
              <Link href="/classroom-copilot">
                {t("featOpenApp")}
                <ArrowRight className="ms-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
