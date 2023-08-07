export type Header = {
  value: string,
  attrs: Record<string, string>,
};

export function strToHeader(str: string): Header {
  const [value, ...attrs] = str.split(';');
  return {
    value: value.trim().toLowerCase(),
    attrs: attrs.reduce(
      (a, attr) => {
        const [key, val] = attr.split('=');
        const normalizedKey = key.trim();
        let normalizedValue = val?.trim() ?? '';
        try {
          normalizedValue = JSON.parse(normalizedValue);
        } catch (e) { /* empty */ }
        if (normalizedValue) {
          return { ...a, [normalizedKey]: normalizedValue };
        }
        return a;
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
  return [header.value.trim(), attrsStr.trim()].filter((str) => str.length).join('; ');
}

export function parseHeaderStr(str: string): { name: string, header: Header } {
  const [name, content] = str.split(':');
  if (!name || !content) {
    throw new Error(`Invalid header: ${str}`);
  }
  return {
    name: name.trim().toLowerCase(),
    header: strToHeader(content),
  };
}
