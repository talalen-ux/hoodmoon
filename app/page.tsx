import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TrustBanner } from "@/components/TrustBanner";
import { WhyHoodMoon } from "@/components/WhyHoodMoon";
import { HowItWorks } from "@/components/HowItWorks";
import { HooksSection } from "@/components/HooksSection";
import { Tokenomics } from "@/components/Tokenomics";
import { LiveMetrics } from "@/components/LiveMetrics";
import { Community } from "@/components/Community";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <TrustBanner />
        <WhyHoodMoon />
        <HowItWorks />
        <HooksSection />
        <Tokenomics />
        <LiveMetrics />
        <Community />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
