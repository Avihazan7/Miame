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
import Partner from "@/components/Partner";
import Importer from "@/components/Importer";
import Footer from "@/components/Footer";
import FloatingWa from "@/components/FloatingWa";
import StickyCta from "@/components/StickyCta";
import LaunchOfferStrip from "@/components/LaunchOfferStrip";
import TrustSignalBar from "@/components/TrustSignalBar";
import DealBuzz from "@/components/DealBuzz";
import EilatBranch from "@/components/EilatBranch";
import RentalFleet from "@/components/RentalFleet";
import CinematicVideo from "@/components/CinematicVideo";

export default function Page() {
  return (
    <>
      <Header />
      <LaunchOfferStrip />
      <main id="main">
        <Hero />
        <TrustSignalBar />
        <EntryPaths />
        <About />
        <Lifestyle />
        <TestRide />
        <Features />
        <Specs />
        <Engineering />
        <Patents />
        <LegalStatus />
        <CinematicVideo />
        <Configurator />
        <EilatBranch />
        <RentalFleet />
        <DealBuzz />
        <AskBrain />
        <Spyqe />
        <Tribute />
        <Service />
        <Partner />
      </main>
      <Importer />
      <Footer />
      <FloatingWa />
      <StickyCta />
    </>
  );
}
