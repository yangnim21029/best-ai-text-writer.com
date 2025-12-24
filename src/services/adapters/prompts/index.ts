import { contentPrompts } from './content';
import { researchPrompts } from './research';
import { visualPrompts } from './visual';
import { regionalPrompts } from './regional';

export const prompts = {
  content: contentPrompts,
  research: researchPrompts,
  visual: visualPrompts,
  regional: regionalPrompts,
};

// Also export individual domain prompts for easier access
export { contentPrompts, researchPrompts, visualPrompts, regionalPrompts };
