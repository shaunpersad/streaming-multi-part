export type Header = {
  value: string,
  attrs: Record<string, string>,
};

export function strToHeader(str: string): Header {
  const [value, attrs] = str.split(';');
  return {
    value: value.trim().toLowerCase(),
    attrs: attrs.split('=').reduce(
      (a, [key, val]) => {
        const normalizedKey = key.trim();
        let normalizedValue = val.trim();
        try {
          normalizedValue = JSON.parse(normalizedValue);
        } catch (e) { /* empty */ }
        return { ...a, [normalizedKey]: normalizedValue };
      },
      {} as Record<string, string>,
    ),
  };
}

export function headerToStr(header: Header): string {
  const attrsStr = Object.entries(header.attrs)
    .map(
      ([key, val]) => `${key}=${JSON.stringify(val)}`,
    )
    .join('; ');
  return `${header.value}; ${attrsStr}`;
}
