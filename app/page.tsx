import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import Services from "./components/Services";
import HowWorks from "./components/HowWorks";
import Pacheges from "./components/Pacheges";
import Footer from "./components/Footer";

export default function Page() {
  return (
    <>
      <Navigation />
      <Hero />
      <Services />
      <HowWorks />
      <Pacheges />
      <Footer />
    </>
  );
}