import { SITE } from "../consts";

export const getCanonical = (path = ''): string | URL => {
  return String(new URL(path, SITE.site));
};