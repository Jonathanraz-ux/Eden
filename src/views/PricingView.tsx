import { useState } from 'react';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useRatePlans, useDeleteRatePlan, useSeasons, useDeleteSeason } from '../lib/hooks/usePricing';
import { useRoomTypes } from '../lib/hooks/useRooms';
import { RatePlanModal } from '../components/RatePlanModal';
import { SeasonModal } from '../components/SeasonModal';
import { cn, formatCents } from '../lib/utils';
import { Euro, CalendarRange, Plus, Edit2, Trash2, Tag, RefreshCw } from 'lucide-react';
import { triggerToast } from '../components/Toast';
import type { RatePlan, Season } from '../lib/types/database';

type Tab = 'rate_plans' | 'seasons';

const PRICING_MODE_LABELS: Record<string, string> = {
  percentage: '%',
  fixed_amount: '€ fixe',
  fixed_price: 'Prix fixe',
  per_night: '€/nuit',
  weekend_price: 'Week-end',
  event_price: 'Événement',
};

export function PricingView() {
  const hotelId = useCurrentHotelId();
  const { data: ratePlans = [], isLoading: loadingPlans } = useRatePlans(hotelId ?? '');
  const { data: seasons = [], isLoading: loadingSeasons } = useSeasons(hotelId ?? '');
  const { data: roomTypes } = useRoomTypes(hotelId ?? '');
  const deleteRatePlan = useDeleteRatePlan();
  const deleteSeason = useDeleteSeason();

  const [activeTab, setActiveTab] = useState<Tab>('rate_plans');
  const [editingPlan, setEditingPlan] = useState<RatePlan | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [showSeasonForm, setShowSeasonForm] = useState(false);

  const handleDeletePlan = (plan: RatePlan) => {
    if (!window.confirm(`Supprimer le plan "${plan.name}" ?`)) return;
    deleteRatePlan.mutate(plan.id, {
      onSuccess: () => triggerToast('Plan supprimé'),
    });
  };

  const handleDeleteSeason = (season: Season) => {
    if (!window.confirm(`Supprimer la saison "${season.name}" ?`)) return;
    deleteSeason.mutate(season.id, {
      onSuccess: () => triggerToast('Saison supprimée'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif text-[#1A1A1A]">Tarifs & Saisons</h1>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 font-medium">
          {roomTypes?.length ?? 0} types de chambres
        </p>
      </div>

      <div className="flex gap-2 border-b border-[#1A1A1A]/10">
        <button
          onClick={() => setActiveTab('rate_plans')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all border-b-2 -mb-px",
            activeTab === 'rate_plans'
              ? "border-[#C5A059] text-[#1A1A1A]"
              : "border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70"
          )}
        >
          <Euro className="w-3.5 h-3.5" />
          Plans Tarifaires
          <span className="ml-1 text-[#1A1A1A]/20">({ratePlans.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('seasons')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all border-b-2 -mb-px",
            activeTab === 'seasons'
              ? "border-[#C5A059] text-[#1A1A1A]"
              : "border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70"
          )}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          Saisons
          <span className="ml-1 text-[#1A1A1A]/20">({seasons.length})</span>
        </button>
      </div>

      {activeTab === 'rate_plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#1A1A1A]/40">{ratePlans.length} plan(s) tarifaire(s)</p>
            <button
              onClick={() => { setEditingPlan(null); setShowPlanForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors rounded-sm"
            >
              <Plus className="w-3 h-3" /> Nouveau Plan
            </button>
          </div>

          {loadingPlans ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#1A1A1A]/10 rounded-sm p-5 space-y-2">
                  <div className="w-40 h-4 bg-[#1A1A1A]/5 animate-pulse" />
                  <div className="w-64 h-3 bg-[#1A1A1A]/5 animate-pulse" />
                </div>
              ))}
            </div>
          ) : ratePlans.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#1A1A1A]/10 rounded-sm">
              <Tag className="w-8 h-8 mx-auto text-[#1A1A1A]/20 mb-3" />
              <p className="text-sm text-[#1A1A1A]/40">Aucun plan tarifaire</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ratePlans.map(plan => (
                <div key={plan.id} className="bg-white border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20 transition-all rounded-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center shrink-0">
                        <Euro className="w-4 h-4 text-[#C5A059]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-medium text-[#1A1A1A]">{plan.name}</h4>
                          {plan.is_refundable ? (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm font-medium">Remboursable</span>
                          ) : (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-sm font-medium">Non remboursable</span>
                          )}
                          {!plan.is_active && (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-sm font-medium">Inactif</span>
                          )}
                        </div>
                        {plan.description && (
                          <p className="text-[11px] text-[#1A1A1A]/50 mt-1">{plan.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-[#1A1A1A]/40">
                          {plan.deposit_required_cents != null && (
                            <span>Acompte : {formatCents(plan.deposit_required_cents)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setEditingPlan(plan); setShowPlanForm(true); }}
                        className="p-2 border border-[#1A1A1A]/10 hover:border-[#C5A059]/40 text-[#1A1A1A]/40 hover:text-[#C5A059] transition-all rounded-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan)}
                        className="p-2 border border-[#1A1A1A]/10 hover:border-red-300 text-[#1A1A1A]/40 hover:text-red-500 transition-all rounded-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'seasons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#1A1A1A]/40">{seasons.length} saison(s)</p>
            <button
              onClick={() => { setEditingSeason(null); setShowSeasonForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors rounded-sm"
            >
              <Plus className="w-3 h-3" /> Nouvelle Saison
            </button>
          </div>

          {loadingSeasons ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#1A1A1A]/10 rounded-sm p-5 space-y-2">
                  <div className="w-40 h-4 bg-[#1A1A1A]/5 animate-pulse" />
                  <div className="w-64 h-3 bg-[#1A1A1A]/5 animate-pulse" />
                </div>
              ))}
            </div>
          ) : seasons.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#1A1A1A]/10 rounded-sm">
              <CalendarRange className="w-8 h-8 mx-auto text-[#1A1A1A]/20 mb-3" />
              <p className="text-sm text-[#1A1A1A]/40">Aucune saison définie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {seasons.map(season => (
                <div key={season.id} className="bg-white border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20 transition-all rounded-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center shrink-0">
                        <CalendarRange className="w-4 h-4 text-[#1A1A1A]/50" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-medium text-[#1A1A1A]">{season.name}</h4>
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 rounded-sm font-medium text-[#1A1A1A]/60">
                            P. {season.priority}
                          </span>
                          {!season.is_active && (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-sm font-medium">Inactive</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-[#1A1A1A]/40">
                          <span>{season.start_date} → {season.end_date}</span>
                          <span className="font-medium text-[#C5A059]">
                            {season.pricing_mode === 'percentage' ? `${season.value}%` : `${(season.value / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
                            <span className="text-[#1A1A1A]/30 ml-0.5">{PRICING_MODE_LABELS[season.pricing_mode]}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setEditingSeason(season); setShowSeasonForm(true); }}
                        className="p-2 border border-[#1A1A1A]/10 hover:border-[#C5A059]/40 text-[#1A1A1A]/40 hover:text-[#C5A059] transition-all rounded-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSeason(season)}
                        className="p-2 border border-[#1A1A1A]/10 hover:border-red-300 text-[#1A1A1A]/40 hover:text-red-500 transition-all rounded-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showPlanForm && <RatePlanModal ratePlan={editingPlan} onClose={() => { setShowPlanForm(false); setEditingPlan(null); }} />}
      {showSeasonForm && <SeasonModal season={editingSeason} onClose={() => { setShowSeasonForm(false); setEditingSeason(null); }} />}
    </div>
  );
}
