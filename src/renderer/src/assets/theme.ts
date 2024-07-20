import { css } from 'lit';

export const THEME = {
  PRIMARY_COLOR: css`#c082ff`,
  PRIMARY_FG_COLOR: css`#0a0a12`,
  BG_COLOR: css`#0a0a12`,
  BG_COLOR_TRANS: css`#0a0a12dd`,
  FG_COLOR: css`#FFFFFF`,
  BG_SECONDARY_COLOR: css`#171728`,
  BG_SECONDARY_HOVER_COLOR: css`#272741`,
  CHANNEL_BG_COLOR: css`#ffffff`
};
export const SCROLLBAR_STYLE = css`
  ::-webkit-scrollbar {
    width: 10px;
  }
  ::-webkit-scrollbar-track {
    background: ${THEME.BG_COLOR};
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${THEME.BG_SECONDARY_COLOR};
    border-radius: 5px;
    border-right: 4px solid ${THEME.BG_COLOR};
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: ${THEME.BG_SECONDARY_HOVER_COLOR};
  }
`;
export const INPUT_STYLE = css`
  width: 100%;
  box-sizing: border-box;
  background-color: transparent;
  border: 2px solid ${THEME.BG_SECONDARY_COLOR};
  border-radius: 5px;
  padding: 10px;
`;
export const INPUT_FOCUS_STYLE = css`
  outline: 2px solid ${THEME.PRIMARY_COLOR};
  outline-offset: 2px;
`;
