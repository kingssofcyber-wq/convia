import Link from "next/link";
import { FileText, Shield, Heart, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0B1120] text-slate-300 pt-20 pb-10 border-t border-white/10">
      <div className="container max-w-6xl mx-auto px-4">
        
        {/* Top Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-20">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center text-white font-extrabold text-lg shadow-lg">
                C
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">convia</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              PDF Tools - Smart Solutions - Endless Possibilities. Useful digital tools for documents, money, protection and everyday wellbeing.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-6">PDF Tools</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/pdf/compress" className="hover:text-white transition-colors">Compress PDF</Link></li>
              <li><Link href="/pdf/merge" className="hover:text-white transition-colors">Merge PDF</Link></li>
              <li><Link href="/pdf/split" className="hover:text-white transition-colors">Split PDF</Link></li>
              <li><Link href="/pdf/organize" className="hover:text-white transition-colors">Organize PDF</Link></li>
              <li><Link href="/pdf" className="hover:text-white transition-colors">All tools</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-6">Explore</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/finance" className="hover:text-white transition-colors">Loans & EMI</Link></li>
              <li><Link href="/insurance" className="hover:text-white transition-colors">Insurance</Link></li>
              <li><Link href="/health" className="hover:text-white transition-colors">Health</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Convia</Link></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-6">Information</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Giant Center Logo */}
        <div className="pt-10 border-t border-white/10 flex flex-col items-center justify-center text-center">
          <Link href="/" className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary grid place-items-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/20">
              C
            </div>
            <span className="font-extrabold text-4xl tracking-tight text-white">convia</span>
          </Link>
          
          <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-6">
            PDF Tools • Smart Solutions • Endless Possibilities
          </p>

          <div className="text-sm text-slate-500">
            <p className="mb-2">Created by <a href="#" className="text-white font-semibold hover:underline">Mivaan Jangra</a></p>
            <p className="text-xs uppercase tracking-widest text-slate-600 mb-8">Every need, one place.</p>
            <p className="text-xs">© {new Date().getFullYear()} Convia. All rights reserved.</p>
          </div>
        </div>
        
      </div>
    </footer>
  );
}