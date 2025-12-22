interface TurboSection {
  title: string;
}

export const buildTurboPlaceholder = (
  sections: TurboSection[],
  outlineSourceLabel: string
): string => {
  const headerBanner = `> 📑 **Active Blueprint:** ${outlineSourceLabel}\n\n`;

  const placeholders = sections.map((s) => `> ⏳ **Writing Section:** ${s.title}...`).join('\n\n');

  return headerBanner + placeholders;
};

export const mergeTurboSections = (sections: TurboSection[], sectionContents: string[]): string => {
  const placeholders = sections
    .map((s, idx) => {
      const content = sectionContents[idx];
      if (content) return content;
      return `> ⏳ **Writing Section:** ${s.title}...`;
    })
    .join('\n\n');

  const headerBanner = `> 📑 **Active Blueprint:** Turbo Mode\n\n`;

  return headerBanner + placeholders;
};
