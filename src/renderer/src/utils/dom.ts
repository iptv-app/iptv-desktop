export const waitForElement = (
  el: ShadowRoot,
  selector: string,
  signal: AbortSignal
): Promise<HTMLElement> => {
  return new Promise((resolve) => {
    if (el.querySelector(selector)) {
      return resolve(el.querySelector<HTMLElement>(selector)!);
    }

    const observer = new MutationObserver((_mutations) => {
      if (el.querySelector(selector)) {
        observer.disconnect();
        resolve(el.querySelector<HTMLElement>(selector)!);
      }
    });

    observer.observe(el, {
      childList: true,
      subtree: true
    });
    signal.addEventListener('abort', () => {
      observer.disconnect();
    });
  });
};
