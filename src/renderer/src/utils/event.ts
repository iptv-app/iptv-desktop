export enum ECustomEvent {
  nextChannel = 'nextChannel',
  prevChannel = 'prevChannel'
}
export const dispatchEvent = <T>(name: ECustomEvent, detail?: T) => {
  const event = new CustomEvent<T>(name, {
    detail
  });
  window.dispatchEvent(event);
};
