import { IPTVChannel } from '../../../preload/iptv.type';

export const channelName = (channel: IPTVChannel) => {
  let channelName: string | undefined = undefined;
  if (window.__appConfig?.iptv?.isUseAltChannelName) {
    channelName = channel.alt_names[0];
  }
  if (!channelName) {
    channelName = channel.name;
  }
  return channelName;
};
