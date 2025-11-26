interface TurboSection {
    title: string;
}

export const buildTurboPlaceholder = (sections: TurboSection[], outlineSourceLabel: string): string => {
    const headerBanner = `
    <div class="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs font-mono text-slate-500">
        <span class="font-bold text-slate-700">📑 Active Blueprint:</span> ${outlineSourceLabel}
    </div>
  `;

    const placeholders = sections.map(s =>
        `<div class="p-4 my-4 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-3 animate-pulse">
         <div class="w-4 h-4 rounded-full bg-blue-400"></div>
         <div class="flex flex-col">
            <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">STRUCTURE LOCKED</span>
            <span class="text-sm font-medium text-blue-900">⏳ Writing Section: ${s.title}...</span>
         </div>
       </div>`
    ).join('\n\n');

    return headerBanner + placeholders;
};

export const mergeTurboSections = (sections: TurboSection[], sectionContents: string[]): string => {
    const placeholders = sections.map((s, idx) => {
        const content = sectionContents[idx];
        if (content) return content;
        return `<div class="p-4 my-4 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-3 animate-pulse">
             <div class="w-4 h-4 rounded-full bg-blue-400"></div>
             <div class="flex flex-col">
                <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">STRUCTURE LOCKED</span>
                <span class="text-sm font-medium text-blue-900">⏳ Writing Section: ${s.title}...</span>
             </div>
          </div>`;
    }).join('\n\n');

    const headerBanner = `
    <div class="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs font-mono text-slate-500">
        <span class="font-bold text-slate-700">📑 Active Blueprint:</span> <span class="text-blue-600">Turbo Mode</span>
    </div>
  `;

    return headerBanner + placeholders;
};
