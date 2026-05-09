"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Logo } from "@/components/logo";
import { Github, Heart } from "lucide-react";
import { useLandingLocale } from "../landing-locale-context";

const socialLinks = [
  {
    name: "GitHub",
    href: "https://github.com/search?q=classroom+copilot+valsea&type=repositories",
    icon: Github,
  },
];

function FooterNewsletter({ locale }: { locale: "vi" | "en" }) {
  const { t } = useLandingLocale();

  const newsletterSchema = useMemo(
    () =>
      z.object({
        email: z.string().email({ message: t("footErrEmail") }),
      }),
    [locale, t],
  );

  type NewsletterValues = z.infer<typeof newsletterSchema>;

  const form = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: NewsletterValues) {
    console.log(values);
    form.reset();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-2 max-w-md mx-auto sm:flex-row"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input type="email" placeholder={t("footEmailPh")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="cursor-pointer">
          {t("footSubscribe")}
        </Button>
      </form>
    </Form>
  );
}

type FooterLink = { name: string; href: string };

export function LandingFooter() {
  const { t, locale } = useLandingLocale();

  const footerLinks = useMemo((): {
    product: FooterLink[];
    app: FooterLink[];
    resources: FooterLink[];
    legal: FooterLink[];
  } => ({
    product: [
      { name: t("footLinkFeatures"), href: "#features" },
      { name: t("footLinkAbout"), href: "#about" },
      { name: t("footLinkFaq"), href: "#faq" },
      { name: t("footLinkContact"), href: "#contact" },
    ],
    app: [
      { name: t("footLinkCopilot"), href: "/classroom-copilot" },
      // Temporarily hidden — restore when auth is ready
      // { name: t("navSignIn"), href: "/auth/sign-in" },
      // { name: t("navSignUp"), href: "/auth/sign-up" },
    ],
    resources: [
      // Temporarily hidden — Landing home / duplicate route links
      // { name: t("footLinkHome"), href: "/" },
      // { name: t("footLinkLandingPath"), href: "/landing" },
    ],
    legal: [
      { name: t("footLinkPrivacy"), href: "#privacy" },
      { name: t("footLinkTerms"), href: "#terms" },
      { name: t("footLinkSecurity"), href: "#security" },
    ],
  }), [t, locale]);

  const copyright = t("footCopyright").replace(
    "{year}",
    String(new Date().getFullYear()),
  );

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-16">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-2xl font-bold mb-4">{t("footNewsTitle")}</h3>
            <p className="text-muted-foreground mb-6 text-pretty">{t("footNewsLead")}</p>
            <FooterNewsletter key={locale} locale={locale} />
          </div>
        </div>

        <div className="grid gap-8 grid-cols-4 lg:grid-cols-6">
          <div className="col-span-4 lg:col-span-2 max-w-2xl">
            <div className="flex items-center space-x-2 mb-4 max-lg:justify-center">
              <Link href="/" className="flex items-center space-x-2 cursor-pointer">
                <Logo size={32} />
                <span className="font-bold text-xl">Classroom Copilot</span>
              </Link>
            </div>
            <p className="text-muted-foreground mb-6 max-lg:text-center max-lg:flex max-lg:justify-center text-pretty">
              {t("footTagline")}
            </p>
            <div className="flex space-x-4 max-lg:justify-center">
              {socialLinks.map((social) => (
                <Button key={social.name} variant="ghost" size="icon" asChild>
                  <a
                    href={social.href}
                    aria-label={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          <div className="max-md:col-span-2 lg:col-span-1">
            <h4 className="font-semibold mb-4">{t("footColProduct")}</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="max-md:col-span-2 lg:col-span-1">
            <h4 className="font-semibold mb-4">{t("footColApp")}</h4>
            <ul className="space-y-3">
              {footerLinks.app.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {footerLinks.resources.length > 0 ? (
            <div className="max-md:col-span-2 lg:col-span-1">
              <h4 className="font-semibold mb-4">{t("footColPages")}</h4>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="max-md:col-span-2 lg:col-span-1">
            <h4 className="font-semibold mb-4">{t("footColLegal")}</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col lg:flex-row justify-between items-center gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              <span>{t("footMadeWith")}</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>{t("footForLearners")}</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>{copyright}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-4 md:mt-0">
            <a href="#privacy" className="hover:text-foreground transition-colors">
              {t("footLinkPrivacy")}
            </a>
            <a href="#terms" className="hover:text-foreground transition-colors">
              {t("footLinkTerms")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
