import { useRecoilValue } from "recoil";
import { useEditor } from "../../../context/EditorContext";
import { VerticalDivider } from "../styled";
import { Bold } from "./Bold";

import { cursorState } from "../../../recoil";
import { useEffect, useState } from "react";
import { Size } from "./Size";
import { isEqual } from "lodash";

export interface CursorStyle {
  fontSize: string;
  isBold: boolean;
}

export function FontStyle() {
  const { editorManger } = useEditor();

  const cursor = useRecoilValue(cursorState);

  const [cursorStyle, setCursorStyle] = useState<CursorStyle>({
    fontSize: "",
    isBold: false,
  });

  useEffect(() => {
    if (!cursor) return;

    let newCursorStyle: CursorStyle;

    const selectRange = editorManger.select.selectRange;

    if (selectRange) {
      const cTextStyle = editorManger.textStyle.checkTextStyle(
        selectRange.start,
        selectRange.end
      );

      newCursorStyle = {
        fontSize: cTextStyle?.fontSize ? String(cTextStyle.fontSize) : "",
        isBold: !!cTextStyle?.bold,
      };
    } else {
      const fontStyle = editorManger.textStyle.getTextStyle(cursor.index);

      newCursorStyle = {
        fontSize: String(fontStyle.fontSize || ""),
        isBold: !!fontStyle.bold,
      };
    }

    if (!isEqual(cursorStyle, newCursorStyle)) {
      setCursorStyle(newCursorStyle);
    }
  }, [cursor]);

  return (
    <>
      <VerticalDivider />
      <Size fontSize={cursorStyle.fontSize} setCursorStyle={setCursorStyle} />
      <VerticalDivider />
      <Bold isBold={cursorStyle.isBold} setCursorStyle={setCursorStyle} />
      <VerticalDivider />
      <VerticalDivider />
    </>
  );
}
