import { createSvgIcon } from "@mui/material/utils";

/** A drawstring pouch with a die on it: "choose your dice set" */
export const DiceBagIcon = createSvgIcon(
  <>
    {/* Ruffle above the cinch */}
    <path d="M9.2 7.6 7.6 4.2c1.5.6 2.6.2 4.4-.9 1.8 1.1 2.9 1.5 4.4.9l-1.6 3.4z" />
    {/* Cinched neck */}
    <rect x="8.3" y="8.2" width="7.4" height="2" rx="1" />
    {/* Pouch, with a die-shaped window */}
    <path
      fillRule="evenodd"
      d="M8.4 11c-3 1.6-4.4 4.6-3.7 7.2.6 2.3 3 3.5 7.3 3.5s6.7-1.2 7.3-3.5c.7-2.6-.7-5.6-3.7-7.2zM12 13.2l2.6 2.6-2.6 2.6-2.6-2.6z"
    />
    {/* Drawstring ends */}
    <path d="M15.4 9.6l3.2 2.3-.6.8-3.2-2.3zM18.9 12.4a.9.9 0 11-.1 1.8.9.9 0 01.1-1.8z" />
  </>,
  "DiceBag"
);
