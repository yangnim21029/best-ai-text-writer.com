import React from 'react';
import { ImageIcon, Plus, Zap, CheckCircle2 } from 'lucide-react';
import { ImageAssetPlan } from '../../types';
import { cn } from '../../utils/cn';

interface QuickInsertPanelProps {
  imagePlans: ImageAssetPlan[];
  onInject: (plan: ImageAssetPlan, method: 'auto' | 'cursor') => void;
  onOpenPlanning: () => void;
}

export const QuickInsertPanel: React.FC<QuickInsertPanelProps> = ({
  imagePlans,
  onInject,
  onOpenPlanning,
}) => {
  const readyPlans = imagePlans.filter((p) => p.status === 'done' && p.url);

  if (readyPlans.length === 0) return null;

  return (
    <aside className="w-20 border-l border-gray-100 bg-gray-50/30 flex flex-col items-center py-4 gap-4 overflow-y-auto custom-scrollbar group/panel transition-all">
      <button
        onClick={onOpenPlanning}
        className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all group"
        title="Open Visual Planning"
      >
        <Zap className="w-5 h-5 group-hover:fill-blue-50" />
      </button>

      <div className="w-8 h-px bg-gray-200" />

      {readyPlans.map((plan) => (
        <div key={plan.id} className="relative group/item">
          <button
            onClick={() => onInject(plan, 'cursor')}
            className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all relative group-hover/item:border-blue-500"
            title="Click to insert at cursor"
          >
            <img src={plan.url} className="w-full h-full object-cover" alt="Generated" />
            <div className="absolute inset-0 bg-blue-600/0 group-hover/item:bg-blue-600/10 transition-colors flex items-center justify-center">
              <Plus className="w-5 h-5 text-white opacity-0 group-hover/item:opacity-100 drop-shadow-md" />
            </div>
          </button>
        </div>
      ))}

      <div className="mt-auto pt-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
          {readyPlans.length}
        </div>
      </div>
    </aside>
  );
};
