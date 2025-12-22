import { useGenerationStore } from '../../store/useGenerationStore';

export const appendAnalysisLog = (msg: string) => {
  const store = useGenerationStore.getState();
  // Only append logs to content during the analysis phase
  if (store.status === 'analyzing') {
    // store.setContent(prev => {
    //     const next = typeof prev === 'string' ? prev : '';
    //     return next ? `${next}\n${msg}` : msg;
    // });
    console.log(`[Analysis Log]: ${msg}`);
  } else {
    console.log(`[Background Log]: ${msg}`);
  }
};

export const summarizeList = (items: string[], max: number = 5) => {
  const slice = items.slice(0, max);
  const more = items.length > max ? ` +${items.length - max}` : '';
  return slice.join(', ') + more;
};
