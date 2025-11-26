import React from 'react';
import { ListTodo, Gem } from 'lucide-react';
import { TargetAudience } from '../../types';

type ChecklistType = 'general' | 'brand';

const ChecklistItem: React.FC<{
    point: string;
    type: ChecklistType;
    isChecked: boolean;
    isProcessing: boolean;
    onToggle: (point: string) => void;
    onRefine: (point: string) => void;
    useTiptap: boolean;
    isTiptapReady: boolean;
}> = React.memo(({
    point,
    type,
    isChecked,
    isProcessing,
    onToggle,
    onRefine,
    useTiptap,
    isTiptapReady,
}) => {
    const handleClickRefine = () => {
        if (useTiptap && !isTiptapReady) {
            alert("Editor not ready.");
            return;
        }
        if (useTiptap) {
            alert("Refine is not yet supported in Tiptap mode.");
            return;
        }
        onRefine(point);
    };

    return (
        <div className={`p-2 rounded-lg text-xs transition-all border group relative ${isChecked ? 'bg-orange-100/50 border-orange-200 text-gray-500' : 'bg-white border-orange-100 text-gray-800 hover:border-orange-300 hover:shadow-sm'}`}>
            <div className="flex items-start gap-2 pr-6 cursor-pointer" onClick={() => onToggle(point)}>
                {isChecked ? <span className="w-4 h-4 text-orange-500 flex-shrink-0">☑</span> : <span className="w-4 h-4 text-orange-300 flex-shrink-0">☐</span>}
                <div className="flex-1">
                    {type === 'brand' && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1 rounded mr-1">USP</span>}
                    <span className={isChecked ? 'line-through opacity-75' : ''}>{point}</span>
                </div>
            </div>
            
            {!isChecked && (
                <button 
                    onClick={(e) => { e.stopPropagation(); handleClickRefine(); }}
                    disabled={isProcessing}
                    className="absolute right-1 top-1 p-1.5 bg-white border border-purple-200 text-purple-600 rounded-md hover:bg-purple-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Auto-insert this point into best paragraph"
                >
                    {isProcessing ? <span className="w-3 h-3 inline-block animate-spin">⏳</span> : <span className="w-3 h-3 inline-block">✨</span>}
                </button>
            )}
        </div>
    );
});

interface KeyPointsPanelProps {
    brandExclusivePoints: string[];
    keyPoints: string[];
    checkedPoints: string[];
    refiningPoint: string | null;
    onTogglePoint?: (point: string) => void;
    onRefinePoint?: (point: string) => void;
    useTiptap: boolean;
    isTiptapReady: boolean;
    uniqueCoveredCount: number;
    totalPoints: number;
    targetAudience?: TargetAudience;
}

export const KeyPointsPanel: React.FC<KeyPointsPanelProps> = ({
    brandExclusivePoints,
    keyPoints,
    checkedPoints,
    refiningPoint,
    onTogglePoint,
    onRefinePoint,
    useTiptap,
    isTiptapReady,
    uniqueCoveredCount,
    totalPoints,
}) => {
    return (
        <div className="w-72 bg-orange-50/50 border-l border-orange-100 p-4 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold uppercase text-orange-600 flex items-center gap-2">
                    <ListTodo className="w-4 h-4" />
                    Key Points
                </h4>
                <span className="text-[10px] font-bold text-gray-400">
                    {uniqueCoveredCount}/{totalPoints}
                </span>
            </div>
            
            <div className="space-y-4">
                {brandExclusivePoints.length > 0 && (
                    <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                            <Gem className="w-3 h-3" /> Brand USP
                        </h5>
                        <div className="space-y-1">
                            {brandExclusivePoints.map((point, i) => (
                                <ChecklistItem 
                                    key={`brand-${i}`} 
                                    point={point} 
                                    type="brand" 
                                    isChecked={checkedPoints.includes(point)}
                                    isProcessing={refiningPoint === point}
                                    onToggle={onTogglePoint || (() => {})}
                                    onRefine={onRefinePoint || (() => {})}
                                    useTiptap={useTiptap}
                                    isTiptapReady={isTiptapReady}
                                />
                            ))}
                        </div>
                    </div>
                )}
                
                {keyPoints.length > 0 && (
                    <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">General Knowledge</h5>
                        <div className="space-y-1">
                            {keyPoints.map((point, i) => (
                                <ChecklistItem 
                                    key={`gen-${i}`} 
                                    point={point} 
                                    type="general" 
                                    isChecked={checkedPoints.includes(point)}
                                    isProcessing={refiningPoint === point}
                                    onToggle={onTogglePoint || (() => {})}
                                    onRefine={onRefinePoint || (() => {})}
                                    useTiptap={useTiptap}
                                    isTiptapReady={isTiptapReady}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
