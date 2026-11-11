import Link from "next/link";
import { 
  ArrowRight, Calculator, Shield, Heart, 
  TrendingUp, Droplets, Clock, User, Sparkles, 
  Ad
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/home/hero";
import { ToolGrid } from "@/components/home/tool-grid";
import { AdSense } from "@/components/ads/adsense";

export default function Home() {
  return (
    <div className="min-h-screen bg-creamy-grid">
      
      {/* 1. Hero Section (बिना सर्च बार के) */}
      <Hero />

      {/* 2. PDF Tools Section (जिसमें सर्च बार, 8 टूल्स और See All है) */}
      <ToolGrid />

      {/* 3. AdSense Banner */}
      <div className="container max-w-5xl mx-auto px-4 mb-20">
        <AdSense adSlot="4116852365" /> 
        <AdSense adSlot="2443937103" />
      </div>

      {/* 4. Finance & Insurance Section */}
      <section className="container max-w-5xl mx-auto px-4 py-20 border-t border-border/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-emerald-500 uppercase mb-2">Protection that makes sense</p>
            <h2 className="text-3xl font-bold text-foreground">Explore cover. Know your options.</h2>
            <p className="text-muted-foreground mt-2 max-w-xl">Learn about common insurance types and the protection they are designed to provide.</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
            <Shield className="w-7 h-7" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { title: "EMI Calculator", desc: "Estimate monthly payments and understand the total cost of a loan.", icon: Calculator, color: "text-indigo-600", bg: "bg-indigo-50", badge: "Popular" },
            { title: "Loan Planner", desc: "Explore repayment timelines and compare loan scenarios.", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50", badge: "Planning" },
            { title: "Health Insurance", desc: "Understand coverage for medical expenses.", icon: Heart, color: "text-rose-600", bg: "bg-rose-50", badge: "Finance" },
            { title: "Life Insurance", desc: "Financial protection for your loved ones.", icon: Shield, color: "text-amber-600", bg: "bg-amber-50", badge: "Protection" },
          ].map((item, i) => (
            <Link key={i} href="#" className="group flex flex-col p-6 rounded-3xl border border-border/60 bg-white hover:border-emerald-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase bg-muted px-2 py-1 rounded-md">{item.badge}</span>
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">{item.desc}</p>
              <span className="text-sm font-bold text-primary flex items-center group-hover:translate-x-1 transition-transform">
                Explore guide <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Health Section */}
      <section className="container max-w-5xl mx-auto px-4 py-20 border-t border-border/50">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold tracking-widest text-cyan-600 uppercase mb-2">Small steps, better awareness</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Everyday health,<br />
              <span className="text-cyan-600">made simpler.</span>
            </h2>
            <p className="text-muted-foreground mb-8 text-base leading-relaxed">
              Explore general wellness tools and practical health information. These utilities are educational and do not replace professional medical advice.
            </p>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-8 h-12 text-base shadow-lg shadow-cyan-600/20">
              Explore health tools <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="space-y-4">
            {[
              { title: "BMI Calculator", desc: "Understand a general screening measure.", icon: User },
              { title: "Water Intake Guide", desc: "Explore general hydration information.", icon: Droplets },
              { title: "Age Calculator", desc: "Calculate age from a date of birth.", icon: Clock },
            ].map((item, i) => (
              <Link key={i} href="#" className="flex items-center justify-between p-5 rounded-2xl bg-white border border-border/60 hover:border-cyan-500/40 hover:shadow-md transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-foreground group-hover:text-cyan-600 transition-colors">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Premium CTA Banner */}
      <section className="container max-w-5xl mx-auto px-4 pb-24 pt-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-indigo-500/20">
          
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[30rem] h-[30rem] bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[20rem] h-[20rem] bg-blue-400/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <p className="text-indigo-200 text-xs font-bold tracking-widest uppercase mb-3 flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-4 h-4" /> One place, many possibilities
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Ready to make your day<br className="hidden md:block" /> a little easier?
            </h2>
            <p className="text-indigo-100 text-base max-w-md mx-auto md:mx-0">
              Find the tool you need and get straight to what matters. Fast, free, and completely private.
            </p>
          </div>
          
          <Button className="relative z-10 bg-white text-indigo-700 hover:bg-slate-100 font-bold rounded-2xl px-10 h-16 text-lg shrink-0 shadow-xl hover:scale-105 transition-transform">
            Find your tool <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

    </div>
  );
}