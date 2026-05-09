"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BookOpen, Mail, Mic } from "lucide-react";
import { useLandingLocale } from "../landing-locale-context";

function ContactFormCard({ locale }: { locale: "vi" | "en" }) {
  const { t } = useLandingLocale();

  const contactFormSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, { message: t("contactErrFirst") }),
        lastName: z.string().min(2, { message: t("contactErrLast") }),
        email: z.string().email({ message: t("contactErrEmail") }),
        subject: z.string().min(5, { message: t("contactErrSubject") }),
        message: z.string().min(10, { message: t("contactErrMessage") }),
      }),
    [locale, t],
  );

  type FormValues = z.infer<typeof contactFormSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(values: FormValues) {
    console.log(values);
    form.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t("contactFormTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contactLabelFirst")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("contactPhFirst")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contactLabelLast")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("contactPhLast")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contactLabelEmail")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@university.edu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contactLabelSubject")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("contactPhSubject")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contactLabelMessage")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("contactPhMessage")}
                      rows={10}
                      className="min-h-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full cursor-pointer">
              {t("contactSubmit")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function ContactSection() {
  const { t, locale } = useLandingLocale();

  return (
    <section id="contact" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            {t("contactBadge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-balance">
            {t("contactTitle")}
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">{t("contactLead")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 order-2 lg:order-1">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  {t("contactCard1Title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3 text-pretty">{t("contactCard1Body")}</p>
                <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                  <Link href="/classroom-copilot">{t("contactCard1Btn")}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {t("contactCard2Title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3 text-pretty">{t("contactCard2Body")}</p>
                <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                  <a href="#features">{t("contactCard2Btn")}</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  {t("contactCard3Title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3 text-pretty">{t("contactCard3Body")}</p>
                <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                  <a href="#contact">{t("contactCard3Btn")}</a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2">
            <ContactFormCard key={locale} locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
