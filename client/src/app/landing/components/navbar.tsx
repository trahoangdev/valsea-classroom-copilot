"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Menu, Github, Mic, X, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { useTheme } from "@/hooks/use-theme";
import { LandingLanguageToggle, useLandingLocale } from "../landing-locale-context";
import type { LandingKey } from "../landing-translations";

const smoothScrollTo = (targetId: string) => {
  if (targetId.startsWith("#")) {
    const element = document.querySelector(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
};

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const { t } = useLandingLocale();

  const navigationItems = useMemo(
    () =>
      [
        { nameKey: "navHome" as const, href: "#hero" },
        { nameKey: "navAbout" as const, href: "#about" },
        { nameKey: "navFeatures" as const, href: "#features" },
        { nameKey: "navFaq" as const, href: "#faq" },
        { nameKey: "navContact" as const, href: "#contact" },
      ] satisfies { nameKey: LandingKey; href: string }[],
    [],
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2 cursor-pointer">
            <Logo size={32} />
            <span className="font-bold">Classroom Copilot</span>
          </Link>
        </div>

        <NavigationMenu className="hidden xl:flex">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.nameKey}>
                <NavigationMenuLink
                  className="group inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium transition-colors hover:text-primary focus:text-primary focus:outline-none cursor-pointer"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    if (item.href.startsWith("#")) {
                      smoothScrollTo(item.href);
                    } else {
                      window.location.href = item.href;
                    }
                  }}
                >
                  {t(item.nameKey)}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden xl:flex items-center space-x-2">
          <LandingLanguageToggle />
          <ModeToggle variant="ghost" />
          <Button variant="ghost" size="icon" asChild className="cursor-pointer">
            <a
              href="https://github.com/search?q=classroom+copilot+valsea&type=repositories"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("navGithubAria")}
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
          {/* Temporarily hidden — restore Sign in when auth is ready
          <Button variant="outline" asChild className="cursor-pointer">
            <Link href="/auth/sign-in">{t("navSignIn")}</Link>
          </Button>
          */}
          <Button asChild className="cursor-pointer">
            <Link href="/classroom-copilot">
              <Mic className="h-4 w-4 mr-2" />
              {t("navOpenApp")}
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <LandingLanguageToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("navMenuOpen")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:w-[400px] p-0 gap-0 [&>button]:hidden overflow-hidden flex flex-col"
            >
              <div className="flex flex-col h-full">
                <SheetHeader className="space-y-0 p-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Logo size={16} />
                    </div>
                    <SheetTitle className="text-lg font-semibold">Classroom Copilot</SheetTitle>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                        className="cursor-pointer h-8 w-8 relative"
                      >
                        <Moon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Sun className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="cursor-pointer h-8 w-8">
                        <a
                          href="https://github.com/search?q=classroom+copilot+valsea&type=repositories"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="GitHub"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        className="cursor-pointer h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                  <nav className="p-6 space-y-1">
                    {navigationItems.map((item) => (
                      <a
                        key={item.nameKey}
                        href={item.href}
                        className="flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        onClick={(e) => {
                          setIsOpen(false);
                          if (item.href.startsWith("#")) {
                            e.preventDefault();
                            setTimeout(() => smoothScrollTo(item.href), 100);
                          }
                        }}
                      >
                        {t(item.nameKey)}
                      </a>
                    ))}
                  </nav>
                </div>

                <div className="border-t p-6 space-y-4">
                  <Button variant="outline" size="lg" asChild className="w-full cursor-pointer">
                    <Link href="/classroom-copilot">
                      <Mic className="size-4" />
                      {t("navOpenApp")}
                    </Link>
                  </Button>
                  {/* Temporarily hidden — restore Sign in / Sign up when auth is ready
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="lg" asChild className="cursor-pointer">
                      <Link href="/auth/sign-in">{t("navSignIn")}</Link>
                    </Button>
                    <Button asChild size="lg" className="cursor-pointer">
                      <Link href="/auth/sign-up">{t("navSignUp")}</Link>
                    </Button>
                  </div>
                  */}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
