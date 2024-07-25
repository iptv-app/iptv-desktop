import { css } from 'lit';

export const THEME = {
  PRIMARY_COLOR: css`#c082ff`,
  PRIMARY_FG_COLOR: css`#0a0a12`,
  BG_COLOR: css`#0a0a12`,
  BG_COLOR_TRANS_STRONG: css`#0a0a12ee`,
  BG_COLOR_TRANS: css`#0a0a12dd`,
  FG_COLOR: css`#FFFFFF`,
  FG_COLOR_MUTED: css`#FFFFFF55`,
  BG_SECONDARY_COLOR: css`#171728`,
  BG_SECONDARY_HOVER_COLOR: css`#272741`,
  BORDER_COLOR: css`#171728`,
  CHANNEL_BG_COLOR: css`#ffffff`
};
export const SCROLLBAR_STYLE = css`
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: ${THEME.BG_COLOR};
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${THEME.BG_SECONDARY_COLOR};
    border-radius: 5px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: ${THEME.BG_SECONDARY_HOVER_COLOR};
  }
`;
export const INPUT_STYLE = css`
  display: block;
  width: 100%;
  box-sizing: border-box;
  background-color: ${THEME.BG_COLOR_TRANS};
  border: 2px solid ${THEME.BG_SECONDARY_COLOR};
  border-radius: 8px;
  padding: 10px;
  font-size: 1rem;
`;
export const INPUT_FOCUS_STYLE = css`
  outline: 2px solid ${THEME.PRIMARY_COLOR};
  outline-offset: 2px;
`;
