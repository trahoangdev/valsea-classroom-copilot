"use client";

import { LandingNavbar } from "./components/navbar";
import { HeroSection } from "./components/hero-section";
import { LogoCarousel } from "./components/logo-carousel";
import { StatsSection } from "./components/stats-section";
import { FeaturesSection } from "./components/features-section";
import { CTASection } from "./components/cta-section";
import { ContactSection } from "./components/contact-section";
import { FaqSection } from "./components/faq-section";
import { LandingFooter } from "./components/footer";
import { AboutSection } from "./components/about-section";
import { LandingLocaleProvider } from "./landing-locale-context";

export function LandingPageContent() {
  return (
    <LandingLocaleProvider>
      <div className="min-h-screen bg-background">
        <LandingNavbar />

        <main>
          <HeroSection />
          <LogoCarousel />
          <StatsSection />
          <AboutSection />
          <FeaturesSection />
          <FaqSection />
          <CTASection />
          <ContactSection />
        </main>

        <LandingFooter />
      </div>
    </LandingLocaleProvider>
  );
}
