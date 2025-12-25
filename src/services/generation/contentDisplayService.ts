interface TurboSection {
  title: string;
}

export const buildTurboPlaceholder = (
  sections: TurboSection[],
  outlineSourceLabel: string
): string => {
  // User requested to remove all "noise" including the initial list of sections waiting to be written.
  return '';
};

export const mergeTurboSections = (sections: TurboSection[], sectionContents: string[]): string => {
  // Simply join the content that exists. The caller (useContentGenerator) 
  // already decides what to pass in (e.g. empty strings for future sections).
  // We filter out any empty strings here just in case, or we can just join them.
  // The user wants clean output, so no placeholders.

  return sectionContents
    .filter(content => content && content.trim().length > 0)
    .join('\n\n');
};
