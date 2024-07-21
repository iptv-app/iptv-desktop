export const waitForElement = <T extends string = any>(
  el: ShadowRoot,
  selector: T,
  signal: AbortSignal
): Promise<Element> => {
  return new Promise((resolve) => {
    if (el.querySelector(selector)) {
      return resolve(el.querySelector(selector)!);
    }

    const observer = new MutationObserver((_mutations) => {
      if (el.querySelector(selector)) {
        observer.disconnect();
        resolve(el.querySelector(selector)!);
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
