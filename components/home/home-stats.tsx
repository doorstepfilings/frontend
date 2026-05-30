import { AnimatedCounter } from "@/components/ui/animated-counter";

const STATS = [
  { number: 500, suffix: "+", label: "Happy Clients" },
  { number: 11, suffix: "+", label: "Years Experience" },
  { number: 1000, suffix: "+", label: "Projects Completed" },
  { number: 50, suffix: "+", label: "Expert Team" },
] as const;

export function HomeStats() {
  return (
    <section className="border-b border-gray-100 bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="group text-center">
              <h3 className="mb-2 text-4xl font-extrabold text-gray-900 transition-colors group-hover:text-amber-500 md:text-5xl">
                <AnimatedCounter target={stat.number} />
                {stat.suffix}
              </h3>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
