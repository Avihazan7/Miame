import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Lifestyle from "@/components/Lifestyle";
import TestRide from "@/components/TestRide";
import Features from "@/components/Features";
import Specs from "@/components/Specs";
import Patents from "@/components/Patents";
import Configurator from "@/components/Configurator";
import Spyqe from "@/components/Spyqe";
import Tribute from "@/components/Tribute";
import Service from "@/components/Service";
import Partner from "@/components/Partner";
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
        <Patents />
        <Configurator />
        <Spyqe />
        <Tribute />
        <Service />
        <Partner />
      </main>
      <Footer />
      <FloatingWa />
      <StickyCta />
    </>
  );
}
