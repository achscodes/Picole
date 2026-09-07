import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Heart, Leaf, Sparkles } from "lucide-react";
import {
  BRAND,
  BRAND_IMAGES,
  CATEGORIES,
  DEFAULT_PRODUCTS,
  FLAVOR_CATEGORY_IDS,
} from "@/data/catalog";

export const metadata: Metadata = {
  title: "Picolé Healthy Ice Pops | Happiness on a Stick",
  description:
    "Discover colorful, refreshing Picolé ice pops made in the Philippines.",
};

const flavorCategories = CATEGORIES.filter((category) =>
  FLAVOR_CATEGORY_IDS.includes(category.id as (typeof FLAVOR_CATEGORY_IDS)[number]),
);

const bestSellers = DEFAULT_PRODUCTS.filter((product) => product.bestSeller);

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-hidden bg-[#fffaf4] text-[var(--ink)]">
      <header className="absolute inset-x-0 top-0 z-20 border-b border-black/5 bg-white">
        <div className="relative mx-auto flex max-w-7xl items-center px-5 py-5 sm:px-8 lg:px-10">
          <a href="#top" className="flex items-center gap-3" aria-label="Picolé home">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card">
              <Image src={BRAND.logo} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            </span>
            <span className="font-display text-lg font-bold text-[var(--brand-green-dark)]">
              Picolé
            </span>
          </a>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-sm font-semibold md:flex" aria-label="Main navigation">
            <a href="#flavors" className="transition hover:text-[var(--brand-green)]">Flavors</a>
            <a href="#about" className="transition hover:text-[var(--brand-green)]">About Us</a>
            <a href="#celebrate" className="transition hover:text-[var(--brand-green)]">Celebrate</a>
          </nav>

        </div>
      </header>

      <main>
        <section id="top" className="relative flex min-h-[640px] items-center overflow-hidden px-5 pb-16 pt-32 sm:px-8 lg:px-10">
          <Image
            src={BRAND_IMAGES.hero}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/20" />
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-green-dark)] shadow-sm">
                <Sparkles className="h-4 w-4" /> Proudly Filipino
              </p>
              <h1 className="font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] text-[var(--ink)] sm:text-6xl lg:text-8xl">
                Happiness on
                <span className="block text-[var(--brand-green)]">a stick.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[var(--ink-muted)] sm:text-lg">
                Colorful, refreshing ice pops in flavors made for every kind of craving—from bright and fruity to rich and creamy.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#flavors" className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-green)] px-6 py-3.5 text-sm font-bold text-white shadow-float transition hover:-translate-y-0.5">
                  Explore our flavors <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#about" className="rounded-full border border-[var(--ink)]/10 bg-white/80 px-6 py-3.5 text-sm font-bold text-[var(--ink)] transition hover:bg-white">
                  Our story
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="flavors" className="scroll-mt-10 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-green)]">Our healthy flavors</p>
              <h2 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl">The merrier, the healthier.</h2>
              <p className="mt-4 text-[var(--ink-muted)]">Discover 39 flavors across six delicious Picolé collections.</p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {flavorCategories.map((category, index) => {
                const flavors = DEFAULT_PRODUCTS.filter((product) => product.categoryId === category.id);
                return (
                  <article key={category.id} className="group overflow-hidden rounded-[2rem] bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-float">
                    <div className={`relative aspect-[4/3] overflow-hidden ${index % 3 === 0 ? "bg-[#fff0db]" : index % 3 === 1 ? "bg-[#e9f5ed]" : "bg-[#f5e8f3]"}`}>
                      <Image src={category.image ?? BRAND.logo} alt={`${category.name} flavor board`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-contain p-4 transition duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display text-2xl font-black">{category.name}</h3>
                        <span className="rounded-full bg-[var(--brand-green-soft)] px-3 py-1 text-xs font-bold text-[var(--brand-green-dark)]">{flavors.length} flavors</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{flavors.map((flavor) => flavor.name).join(" · ")}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[var(--brand-green-dark)] px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Crowd favorites</p>
                <h2 className="mt-3 font-display text-4xl font-black">Meet the best sellers.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-white/70">A little fruity, a little creamy, and loved across every Picolé collection.</p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              {bestSellers.map((flavor) => (
                <div key={flavor.id} className="rounded-full border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-sm">
                  <span className="font-bold">{flavor.name}</span>
                  <span className="ml-2 text-xs text-white/60">{CATEGORIES.find((category) => category.id === flavor.categoryId)?.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-10 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] bg-[linear-gradient(145deg,#ffe7d1,#f7dce0,#dcefe7)] shadow-card">
              <Image src={BRAND_IMAGES.milky} alt="Picolé Milky Pops flavor selection" fill sizes="(max-width: 1024px) 90vw, 50vw" className="object-contain p-8" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-green)]">Who we are</p>
              <h2 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl">A proudly Filipino frozen treat.</h2>
              <p className="mt-6 text-base leading-7 text-[var(--ink-muted)]">Founded in 2008 by Al and Tina Mejia, Picolé began with a simple idea: delicious frozen snacks can also be thoughtfully made. The result is an original collection of playful flavors for families to enjoy all year round.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Leaf, label: "Real fruit inspiration" },
                  { icon: Heart, label: "Made for families" },
                  { icon: Sparkles, label: "Original flavors" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-2xl bg-[var(--brand-green-soft)] p-4">
                    <Icon className="h-5 w-5 text-[var(--brand-green)]" />
                    <p className="mt-3 text-sm font-bold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="celebrate" className="scroll-mt-10 px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#f5c94f] px-6 py-12 sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-16 lg:py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink)]/60">Celebrate with Picolé</p>
              <h2 className="mt-3 font-display text-4xl font-black sm:text-5xl">Bring happiness to the party.</h2>
              <p className="mt-4 leading-7 text-[var(--ink)]/70">Turn birthdays, school events, and special gatherings into colorful moments with crowd-favorite ice pops.</p>
            </div>
            <a href="#flavors" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3.5 text-sm font-bold text-white lg:mt-0">
              Pick your flavors <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-white px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src={BRAND.logo} alt="Picolé" width={36} height={36} className="h-9 w-9 object-contain" />
            <div>
              <p className="font-display text-sm font-bold">Picolé Healthy Ice Pops</p>
              <p className="text-xs text-[var(--ink-muted)]">Happiness on a stick.</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-sm font-semibold text-[var(--ink-muted)]">
            <a href="#flavors" className="hover:text-[var(--brand-green)]">Flavors</a>
            <a href="#about" className="hover:text-[var(--brand-green)]">About</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
