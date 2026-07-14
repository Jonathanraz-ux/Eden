import { Eye, MessageCircle, X } from 'lucide-react';
import { DEMO_WHATSAPP_PHONE, DEMO_WHATSAPP_MESSAGE } from '../data/demo-data';

export function DemoBanner() {
  const whatsappUrl = `https://wa.me/${DEMO_WHATSAPP_PHONE.replace(/[^0-9]/g, '')}?text=${DEMO_WHATSAPP_MESSAGE}`;

  return (
    <div className="bg-gradient-to-r from-[#C5A059]/10 via-[#C5A059]/5 to-[#C5A059]/10 border-b border-[#C5A059]/20 px-4 py-3 lg:px-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-[0.15em]">
              Mode démonstration
            </p>
            <p className="text-[10px] text-[#1A1A1A]/50 mt-0.5">
              Les données affichées sont fictives. Vous pouvez explorer librement le dashboard, mais les modifications ne seront pas enregistrées.
            </p>
          </div>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#1da851] transition-colors rounded-sm shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Demander un dashboard similaire
        </a>
      </div>
    </div>
  );
}
