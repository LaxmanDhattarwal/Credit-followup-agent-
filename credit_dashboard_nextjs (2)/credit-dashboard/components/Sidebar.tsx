"use client";
import { LayoutDashboard, FileText, ClipboardList, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  activeTab: string;
  setActiveTab: (t: string) => void;
}

const nav = [
  { id: "overview",  label: "Overview",    icon: LayoutDashboard },
  { id: "invoices",  label: "Invoice Queue", icon: FileText },
  { id: "audit",     label: "Audit Trail",  icon: ClipboardList },
];

export default function Sidebar({ activeTab, setActiveTab }: Props) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-zinc-800 bg-[#0d0d0f] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-800/40 flex items-center justify-center">
            <Zap size={13} className="text-amber-500" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold text-zinc-100 leading-none">CreditAgent</div>
            <div className="font-mono text-[9px] text-zinc-600 mt-0.5">Finance Automation</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-150",
              activeTab === id
                ? "bg-amber-950/30 text-amber-400 border border-amber-800/30"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon size={14} />
              <span className="font-medium">{label}</span>
            </div>
            {activeTab === id && <ChevronRight size={12} className="text-amber-600" />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-zinc-800">
        <div className="font-mono text-[10px] text-zinc-700 leading-relaxed">
          <div>Model: llama-3.3-70b</div>
          <div>Provider: Groq</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-slow" />
            <span className="text-zinc-600">Last run: 21:03 IST</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
