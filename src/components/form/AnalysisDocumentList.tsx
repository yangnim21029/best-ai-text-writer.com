import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';

interface AnalysisDocumentListProps {
  onShowPlan?: () => void;
}

export const AnalysisDocumentList: React.FC<AnalysisDocumentListProps> = ({ onShowPlan }) => {
  const { 
    analysisDocuments, 
    selectedDocumentIds, 
    toggleDocumentSelection, 
    loadAnalysisDocument, 
    deleteDocument 
  } = useAnalysisStore();

  if (analysisDocuments.length === 0) {
    return (
      <p className="text-[10px] text-gray-400 italic py-2 text-center">
        No knowledge objects yet. Run Step 1 to create one.
      </p>
    );
  }

  return (
    <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
      {analysisDocuments.map((doc) => {
        const isSelected = selectedDocumentIds.includes(doc.id);
        return (
          <div
            key={doc.id}
            role="button"
            tabIndex={0}
            onClick={() => toggleDocumentSelection(doc.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDocumentSelection(doc.id);
              }
            }}
            className={`w-full text-left p-2 rounded-lg border transition-all flex items-center gap-2 group/doc cursor-pointer ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-white border-gray-100 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50'
            }`}
          >
            <div
              className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                isSelected ? 'bg-white border-white' : 'border-gray-300'
              }`}
            >
              {isSelected && <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold truncate">{doc.title}</div>
              <div className={`text-[9px] ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                {new Date(doc.timestamp).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover/doc:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  loadAnalysisDocument(doc.id).then(() => {
                    onShowPlan?.();
                  });
                }}
                className="p-1 rounded hover:bg-white/20 text-gray-300 hover:text-blue-500"
                title="Load & View Plan"
              >
                <FileText className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this analysis document?')) {
                    deleteDocument(doc.id);
                  }
                }}
                className="p-1 rounded hover:bg-white/20 text-gray-300 hover:text-red-500"
                title="Delete Document"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
