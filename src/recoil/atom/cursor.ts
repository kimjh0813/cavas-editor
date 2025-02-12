import { atom } from "recoil";

export interface Cursor {
  x: number;
  y: number;
  pageIndex: number;
  fontSize: number;
}

export const cursorState = atom<Cursor | undefined>({
  key: "cursorState",
  default: undefined,
});
