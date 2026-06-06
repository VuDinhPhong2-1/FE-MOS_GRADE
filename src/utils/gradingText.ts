const GUIDE_LABEL_PATTERN =
  '(?:H\\u01b0\\u1edbng d\\u1eabn(?: s\\u1eeda)?|Guide|G\\u1ee3i \\u00fd)\\s*:';

const GUIDE_LABEL_AT_START_PATTERN =
  '^(?:H\\u01b0\\u1edbng d\\u1eabn(?: s\\u1eeda)?|Guide|G\\u1ee3i \\u00fd)\\s*:\\s*';

const findGuideCutIndex = (text: string): number => {
  const newlineGuideRegex = new RegExp(`\\r?\\n\\s*${GUIDE_LABEL_PATTERN}`, 'i');
  const inlineGuideRegex = new RegExp(`\\s${GUIDE_LABEL_PATTERN}`, 'i');

  const newlineGuideMatch = text.match(newlineGuideRegex);
  const inlineGuideMatch = text.match(inlineGuideRegex);

  return newlineGuideMatch?.index ?? inlineGuideMatch?.index ?? -1;
};

export const extractGradingGuideSection = (value?: string): string => {
  const text = (value || '').trim();
  if (!text) return '';

  const cutIndex = findGuideCutIndex(text);
  if (cutIndex < 0) return '';

  return text
    .slice(cutIndex)
    .replace(new RegExp(GUIDE_LABEL_AT_START_PATTERN, 'i'), '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const stripGradingGuideSection = (value?: string): string => {
  const text = (value || '').trim();
  if (!text) return '';

  const cutIndex = findGuideCutIndex(text);
  const visibleText = cutIndex >= 0 ? text.slice(0, cutIndex) : text;

  return visibleText.replace(/\s+/g, ' ').trim();
};
