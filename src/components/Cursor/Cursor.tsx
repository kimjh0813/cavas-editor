import { useRecoilValue } from "recoil";
import { cursorState } from "../../recoil";

import * as S from "./styled";
import { useEffect, useMemo, useState } from "react";
import { useEditor } from "../../context/EditorContext";

interface CursorProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export function Cursor({ scrollContainerRef }: CursorProps) {
  const { editorManger } = useEditor();

  const cursor = useRecoilValue(cursorState);

  const [isBlinking, setIsBlinking] = useState<boolean>(false);

  const isVisible = useMemo(() => {
    return cursor && !editorManger.select.selectRange;
  }, [cursor]);

  const color = useMemo(() => {
    if (!cursor) return "#000000";

    return editorManger.textStyle.getTextStyle(cursor.index).color;
  }, [cursor]);

  useEffect(() => {
    if (!cursor) return;

    setIsBlinking(false);
    if (!cursor.isFocusCanvas) return;

    const timer = setTimeout(() => setIsBlinking(true), 100);

    return () => clearTimeout(timer);
  }, [cursor]);

  useEffect(() => {
    if (!cursor || !scrollContainerRef.current) return;

    const scrollContainer = scrollContainerRef.current;
    const containerHeight = scrollContainer.clientHeight;
    const cursorPosition = cursor.pageIndex * (1123 + 20) + cursor.y;

    const currentScrollTop = scrollContainer.scrollTop;

    const upperBound = containerHeight * 0.1;
    const lowerBound = containerHeight * 0.9;

    if (cursorPosition < currentScrollTop + upperBound) {
      scrollContainer.scrollTo({
        top: cursorPosition - upperBound,
        behavior: "smooth",
      });
    } else if (cursorPosition > currentScrollTop + lowerBound) {
      scrollContainer.scrollTo({
        top: cursorPosition - lowerBound,
        behavior: "smooth",
      });
    }
  }, [cursor]);

  if (!cursor || !isVisible) return null;

  return (
    <S.Cursor
      $pageIndex={cursor.pageIndex}
      $x={cursor.x}
      $y={cursor.y}
      $fontSize={cursor.fontSize}
      $lineMaxFontSize={cursor.lineMaxFontSize}
      $isBlinking={isBlinking}
      $color={color}
    />
  );
}
