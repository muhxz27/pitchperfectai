import { BenefitsSection } from '../components/landing/BenefitsSection';
import { FinalCtaSection } from '../components/landing/FinalCtaSection';
import { HeroSection } from '../components/landing/HeroSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <BenefitsSection />
      <FinalCtaSection />
    </>
  );
}
