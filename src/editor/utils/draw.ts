import { EditorManger } from "../core/EditorManger";
import { ISelectRange } from "../types/selectRange";
import { ILineText } from "../types/text";
import { measureTextWidth } from "./ctx";
import { getFontStyle } from "./text";

interface DrawTextParams {
  editorManger: EditorManger;
  canvasRefs: React.MutableRefObject<(HTMLCanvasElement | null)[]>;
  shouldUpdateText: boolean;
}

export function drawText({
  editorManger,
  canvasRefs,
  shouldUpdateText,
}: DrawTextParams) {
  // const start = performance.now();
  const lineTexts = editorManger.getCanvasData(shouldUpdateText);

  // const end = performance.now();
  // console.log(`get lineTexts 함수 실행 시간: ${(end - start).toFixed(2)}ms`);

  if (!lineTexts) return;

  const canvasArr = canvasRefs.current;

  for (const canvas of canvasArr) {
    const ctx = canvas?.getContext("2d");

    if (!ctx || !canvas) break;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // TODO:drawLine 최적화 필요
  // const start1 = performance.now();

  for (const [page, value] of lineTexts) {
    for (let i = 0; i < value.length; i++) {
      const lineText = value[i];
      const canvas = canvasArr[page];
      const ctx = canvas?.getContext("2d");

      if (!ctx) return;

      drawLine({
        ctx,
        lineText,
        selectRange: editorManger.select.selectRange,
        composingIndex: editorManger.text.isKoreanComposing
          ? editorManger.cursor.index - 1
          : undefined,
      });
    }
  }

  // const end1 = performance.now();
  // console.log(`drawLine 함수 실행 시간: ${(end1 - start1).toFixed(2)}ms`);
}

interface DrawLineParams {
  ctx: CanvasRenderingContext2D;
  lineText: ILineText;
  selectRange: ISelectRange | null;
  composingIndex?: number;
}
function drawLine({
  lineText,
  ctx,
  selectRange,
  composingIndex,
}: DrawLineParams) {
  let lineX = lineText.x;
  const maxFontSize = lineText.maxFontSize;

  for (let i = 0; i < lineText.text.length; i++) {
    const index = lineText.endIndex - lineText.text.length + 1 + i;
    const textFragment = lineText.text[i];

    ctx.font = getFontStyle(textFragment);
    const textWidth = measureTextWidth(ctx, textFragment.text);

    // ctx.fillStyle = "yellow";
    // ctx.fillRect(lineX, lineText.y, textWidth, maxFontSize * 1.21);

    //draw select
    if (selectRange && index >= selectRange.start && index < selectRange.end) {
      ctx.fillStyle = "rgba(140, 174, 241, 0.5)";
      ctx.fillRect(lineX, lineText.y, textWidth, maxFontSize * 1.48);
    }

    lineX += textWidth;
  }

  lineX = lineText.x;

  for (let i = 0; i < lineText.text.length; i++) {
    const index = lineText.endIndex - lineText.text.length + 1 + i;
    const textFragment = lineText.text[i];

    ctx.font = getFontStyle(textFragment);
    const textWidth = measureTextWidth(ctx, textFragment.text);

    //draw text
    ctx.fillStyle = "black";
    ctx.fillText(textFragment.text, lineX, lineText.y + maxFontSize);

    //draw isComposing
    if (composingIndex === index) {
      const underlineY = lineText.y + maxFontSize * 0.1 + maxFontSize;
      drawTextUnderLine({ ctx, underlineY, lineX, textWidth });
    }

    lineX += textWidth;
  }
}

interface DrawTextUnderLine {
  ctx: CanvasRenderingContext2D;
  underlineY: number;
  lineX: number;
  textWidth: number;
}
function drawTextUnderLine({
  ctx,
  underlineY,
  lineX,
  textWidth,
}: DrawTextUnderLine) {
  ctx.beginPath();
  ctx.moveTo(lineX, underlineY);
  ctx.lineTo(lineX + textWidth, underlineY);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "black";
  ctx.stroke();
}
