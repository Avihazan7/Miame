import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Lifestyle from "@/components/Lifestyle";
import TestRide from "@/components/TestRide";
import Features from "@/components/Features";
import Specs from "@/components/Specs";
import Engineering from "@/components/Engineering";
import Patents from "@/components/Patents";
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

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Lifestyle />
        <TestRide />
        <Features />
        <Specs />
        <Engineering />
        <Patents />
        <Configurator />
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
