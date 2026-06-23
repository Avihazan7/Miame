import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Configurator from "@/components/Configurator";
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
        <Features />
        <Configurator />
        <Partner />
      </main>
      <Footer />
      <FloatingWa />
      <StickyCta />
    </>
  );
}
