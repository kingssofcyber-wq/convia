import { Hero } from "@/components/home/hero";
import { ToolGrid } from "@/components/home/tool-grid";

export default function Home() {
  return (
    <>
      <Hero />
      <section className="container pb-20">
        <ToolGrid />
      </section>
    </>
  );
}