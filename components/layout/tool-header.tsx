import Link from "next/link";
import { ArrowLeft, LucideIcon } from "lucide-react";

interface ToolHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ToolHeader({ title, description, icon: Icon }: ToolHeaderProps) {
  return (
    <header className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden py-8 px-4 shadow-lg">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      
      <div className="container max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Icon + Text */}
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0 hidden md:flex">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm">{title}</h1>
            <p className="text-white/80 text-sm mt-1">{description}</p>
          </div>
        </div>

        {/* Right Side: Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-bold text-white bg-black/20 hover:bg-black/40 px-5 py-2.5 rounded-full backdrop-blur-sm transition-all border border-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tools
        </Link>
      </div>
    </header>
  );
}