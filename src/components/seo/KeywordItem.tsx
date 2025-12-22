import React from 'react';
import { Zap } from 'lucide-react';
import { FrequentWordsPlacementAnalysis } from '@/types';

interface KeywordItemProps {
  kw: FrequentWordsPlacementAnalysis;
}

export const KeywordItem: React.FC<KeywordItemProps> = ({ kw }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group/kw">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[12px] font-black text-gray-800">{kw.word}</span>
      <div className="flex gap-1 flex-wrap">
        {kw.isSentenceStart && (
          <span className="px-1.5 py-0.5 bg-indigo-50 text-blue-600 rounded text-[8px] font-black border border-blue-100">
            START
          </span>
        )}
        {kw.isSentenceEnd && (
          <span className="px-1.5 py-0.5 bg-pink-50 text-pink-600 rounded text-[8px] font-black border border-pink-100">
            END
          </span>
        )}
        {kw.isPrefix && (
          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black border border-blue-100">
            PREFIX
          </span>
        )}
        {kw.isSuffix && (
          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black border border-emerald-100">
            SUFFIX
          </span>
        )}
      </div>
    </div>

    <div className="space-y-1.5">
      {kw.plan?.slice(0, 2).map((p, idx) => (
        <p key={idx} className="text-[10px] text-gray-500 leading-snug flex gap-1.5">
          <Zap className="w-2.5 h-2.5 text-blue-400 mt-0.5 shrink-0" />
          <span>{p}</span>
        </p>
      ))}
    </div>

    {kw.exampleSentence && (
      <div className="mt-2 p-2 bg-indigo-50/30 rounded-lg border border-blue-100/30">
        <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Target Example</p>
        <p className="text-[10px] text-blue-900 leading-snug italic">"{kw.exampleSentence}"</p>
      </div>
    )}

    {kw.snippets && kw.snippets.length > 0 && (
      <div className="mt-2 pt-2 border-t border-gray-50 overflow-hidden">
        <p className="text-[9px] font-black text-gray-300 uppercase mb-1">Context</p>
        <p className="text-[9px] text-gray-400 italic leading-normal line-clamp-2">
          "...{kw.snippets[0]}..."
        </p>
      </div>
    )}
  </div>
);
