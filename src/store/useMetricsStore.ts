import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from './useAppStore';

export const useMetricsStore = () => {
  return useAppStore(
    useShallow((state) => ({
      contentScore: state.contentScore,
      sessionCost: state.sessionCost,
      sessionTokens: state.sessionTokens,

      setContentScore: state.setContentScore,
      addCost: state.addCost,
      resetSessionStats: state.resetSessionStats,
    }))
  );
};
