import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EntryPaths from "@/components/EntryPaths";
import About from "@/components/About";
import Lifestyle from "@/components/Lifestyle";
import TestRide from "@/components/TestRide";
import Features from "@/components/Features";
import Specs from "@/components/Specs";
import Engineering from "@/components/Engineering";
import Patents from "@/components/Patents";
import LegalStatus from "@/components/LegalStatus";
import Configurator from "@/components/Configurator";
import AskBrain from "@/components/AskBrain";
import Spyqe from "@/components/Spyqe";
import Tribute from "@/components/Tribute";
import Service from "@/components/Service";
import Importer from "@/components/Importer";
import Footer from "@/components/Footer";
import FloatingWa from "@/components/FloatingWa";
import StickyCta from "@/components/StickyCta";
import LaunchOfferStrip from "@/components/LaunchOfferStrip";
import TrustSignalBar from "@/components/TrustSignalBar";
import DealBuzz from "@/components/DealBuzz";
import CinematicVideo from "@/components/CinematicVideo";
import FreedomMomentVideo from "@/components/FreedomMomentVideo";
import FaqHome from "@/components/FaqHome";

export default function Page() {
  return (
    <>
      <Header />
      <LaunchOfferStrip />
      <main id="main">
        {/* Homepage flow (Master Spec Part 2 hierarchy): understand the brand →
            get to know the product → feel it (cinema) → run the numbers
            (simulator) → legal trust → eligibility → deepen → act. Rental &
            Partner depth intentionally live on their dedicated pages (#113). */}
        <Hero />
        <TrustSignalBar />
        <EntryPaths variant="homepage" />
        <FreedomMomentVideo />
        <About />
        <Lifestyle />
        <TestRide />
        <Features />
        <Specs />
        <Engineering />
        <Patents />
        <CinematicVideo />
        <Configurator />
        <LegalStatus />
        <Tribute />
        <DealBuzz />
        <AskBrain />
        <Spyqe />
        <Service />
        <FaqHome />
      </main>
      <Importer />
      <Footer />
      <FloatingWa />
      <StickyCta />
    </>
  );
}
