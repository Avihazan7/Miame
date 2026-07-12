import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EntryPaths from "@/components/EntryPaths";
import About from "@/components/About";
import Lifestyle from "@/components/Lifestyle";
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
      {/* P1 — Ultra Master Rhythm: the homepage reads as EIGHT movements, not
          twenty separate beats. Each `.movement` groups its sub-blocks over one
          continuous aurora so the eye counts a single section, not a stack. The
          narrative arc is unchanged (brand → paths → feel → product → deal →
          trust → act → answers); TestRide's redundant CTA folded away (sticky WA
          + Configurator + DealBuzz carry it), Spyqe folded into the closing act. */}
      <main id="main">
        {/* 1 · Hero */}
        <Hero />

        {/* 2 · מסלולי כניסה + אמון */}
        <section className="movement" data-beat="paths" aria-label="מסלולי כניסה">
          <TrustSignalBar />
          <EntryPaths variant="homepage" />
        </section>

        {/* 3 · הסיפור והתחושה */}
        <section className="movement" data-beat="story" aria-label="הסיפור והתחושה">
          <About />
          <Lifestyle />
          <FreedomMomentVideo />
        </section>

        {/* 4 · מתחת למעטפת — המוצר */}
        <section className="movement" data-beat="product" aria-label="המוצר">
          <Features />
          <Specs />
          <Engineering />
          <Patents />
          <CinematicVideo />
        </section>

        {/* 5 · בנו את העסקה */}
        <Configurator />

        {/* 6 · קלנועית, לא רכב + זכאות */}
        <section className="movement" data-beat="trust" aria-label="מעמד חוקי וזכאות">
          <LegalStatus />
          <Tribute />
        </section>

        {/* 7 · הצעד הבא */}
        <section className="movement" data-beat="act" aria-label="הצעד הבא">
          <DealBuzz />
          <AskBrain />
          <Service />
          <Spyqe />
        </section>

        {/* 8 · שאלות נפוצות */}
        <FaqHome />
      </main>
      <Importer />
      <Footer />
      <FloatingWa />
      <StickyCta />
    </>
  );
}
