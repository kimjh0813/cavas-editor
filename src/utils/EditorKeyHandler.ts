import { Cursor } from "../recoil";
import { LineText, TextFragment } from "../types/editor";
import { measureTextWidth } from "./ctx";

const functionKey = [
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
];

export class EditorKeyHandler {
  private _textArr: TextFragment[];
  private _cursorIndex: number;
  private _defaultFontSize: number;
  private _prevRowIndex: number | null;

  protected _selectedIndex: Set<number>;
  protected lineTexts: Map<number, LineText[]>;
  protected _setCursor: (cursor: Cursor) => void;

  constructor(defaultFontSize: number, setCursor: (cursor: Cursor) => void) {
    this._defaultFontSize = defaultFontSize;
    this._textArr = [];
    this._cursorIndex = 0;
    this._prevRowIndex = null;
    this.lineTexts = new Map();
    this._selectedIndex = new Set();

    this._setCursor = setCursor;
  }

  public get textArr(): TextFragment[] {
    return this._textArr;
  }
  public get cursorIndex(): number {
    return this._cursorIndex;
  }
  public get defaultFontSize(): number {
    return this._defaultFontSize;
  }
  public get prevRowIndex(): number | null {
    return this._prevRowIndex;
  }
  public get selectedIndex(): Set<number> {
    return this._selectedIndex;
  }

  addText(text: string) {
    this.deleteSelectedIndex();

    if (this._prevRowIndex !== null) this.setPrevRowIndex(null);

    const newText = {
      text,
      fontSize: this._defaultFontSize,
    };

    this._textArr.splice(this._cursorIndex, 0, newText);

    this._cursorIndex++;
  }

  deleteText() {
    const result = this.deleteSelectedIndex();
    if (result) return;

    if (this._cursorIndex === 0) return;

    if (this._prevRowIndex !== null) this.setPrevRowIndex(null);

    this._textArr.splice(this._cursorIndex - 1, 1);

    if (this._textArr.length === 0) {
      this.notifyTextCleared();
    }

    this._cursorIndex--;
  }

  enter() {
    this.deleteSelectedIndex();

    if (this._prevRowIndex !== null) this.setPrevRowIndex(null);

    this._textArr.splice(this._cursorIndex, 0, {
      text: "\n",
      fontSize: this._defaultFontSize,
    });

    this._cursorIndex++;
  }

  clearSelectedIndex() {
    if (this._selectedIndex.size < 1) return false;

    this._selectedIndex.clear();
    return true;
  }

  updateSelectedIndex(index: number) {
    if (this._selectedIndex.has(index)) {
      this._selectedIndex.delete(index);
    } else {
      this._selectedIndex.add(index);
    }
  }

  deleteSelectedIndex() {
    if (this._selectedIndex.size < 1) return false;

    const minIndex = Math.min(...this._selectedIndex);
    const maxIndex = Math.max(...this._selectedIndex);

    console.log(minIndex, maxIndex);

    this._textArr.splice(minIndex, maxIndex - minIndex + 1);

    this._selectedIndex.clear();

    this._cursorIndex = minIndex;

    return true;
  }

  setPrevRowIndex(rowIndex: number | null) {
    if (rowIndex && rowIndex < 0) return;

    this._prevRowIndex = rowIndex;
  }

  setCursorIndex(index: number) {
    if (index < 0 || this._textArr.length < index) return;
    this._cursorIndex = index;

    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return;

    const lineTextArr: LineText[][] = Array.from(this.lineTexts.values());

    let targetLine: LineText | null = null;
    let pageIndex = 0;

    if (this._cursorIndex > this._textArr.length - 1) {
      const lastPage = lineTextArr[lineTextArr.length - 1];
      targetLine = lastPage[lastPage.length - 1];
      pageIndex = lineTextArr.length - 1;
    } else {
      outerLoop: for (let p = 0; p < lineTextArr.length; p++) {
        for (let i = 0; i < lineTextArr[p].length; i++) {
          const lineText = lineTextArr[p][i];

          if (lineText.endIndex >= this._cursorIndex) {
            targetLine = lineText;
            pageIndex = p;
            break outerLoop;
          }
        }
      }
    }

    if (!targetLine) return;

    let x = targetLine.x;
    const textSliceIndex = Math.max(
      0,
      targetLine.text.length - (targetLine.endIndex - this._cursorIndex) - 1
    );

    targetLine.text.slice(0, textSliceIndex).forEach(({ fontSize, text }) => {
      ctx.font = `500 ${fontSize}px Arial`;
      x += measureTextWidth(ctx, text);
    });

    this._setCursor({
      x,
      y: targetLine.y,
      fontSize: targetLine.maxFontSize,
      pageIndex,
    });
  }

  arrowUp() {
    if (this._cursorIndex === 0) return;

    const lineTextArr: LineText[] = Array.from(this.lineTexts.values()).flat();

    for (let i = 0; i < lineTextArr.length; i++) {
      const lineText = lineTextArr[i];

      // endIndex가 cursorIndex보다 크거나 혹은 마지막 줄일때(가장 끝에 커서가 잡혀있을때는 글자가 있는공간이 아니라 글자를 작성할 공간 인덱스에 있음)
      if (
        lineText.endIndex >= this._cursorIndex ||
        i === lineTextArr.length - 1
      ) {
        if (i === 0) {
          this.setCursorIndex(0);
        } else {
          const prevLineText = lineTextArr[i - 1];

          if (this._prevRowIndex === null)
            this.setPrevRowIndex(
              this._cursorIndex - (prevLineText.endIndex + 1)
            );
          const prevRowIndex = this._prevRowIndex ?? 0;
          const prevRowStartIndex =
            prevLineText.endIndex - prevLineText.text.length + 1;

          const targetCursorIndex = prevRowStartIndex + prevRowIndex;

          this.setCursorIndex(
            targetCursorIndex < prevLineText.endIndex
              ? targetCursorIndex
              : prevLineText.endIndex
          );
        }
        break;
      }
    }
  }

  arrowDown() {
    const textLength = this._textArr.length;
    if (this._cursorIndex > textLength) return;

    const lineTextArr: LineText[] = Array.from(this.lineTexts.values()).flat();

    for (let i = 0; i < lineTextArr.length; i++) {
      const lineText = lineTextArr[i];

      if (lineText.endIndex >= this._cursorIndex) {
        if (i === lineTextArr.length - 1) {
          this.setCursorIndex(textLength);
        } else {
          const nextLineText = lineTextArr[i + 1];

          if (this._prevRowIndex === null)
            this.setPrevRowIndex(
              this._cursorIndex - (lineText.endIndex - lineText.text.length + 1)
            );

          const prevRowIndex = this._prevRowIndex ?? 0;
          const nextRowStartIndex =
            nextLineText.endIndex - nextLineText.text.length + 1;

          let targetCursorIndex = nextRowStartIndex + prevRowIndex;

          if (nextLineText.endIndex < targetCursorIndex) {
            if (
              i === lineTextArr.length - 2 &&
              targetCursorIndex > textLength
            ) {
              targetCursorIndex = textLength;
            } else {
              targetCursorIndex = nextLineText.endIndex;
            }
          }

          this.setCursorIndex(targetCursorIndex);
        }
        break;
      }
    }
  }

  arrowLeft = (event: KeyboardEvent) => {
    if (event.metaKey) {
      const lineTextArr: LineText[] = Array.from(
        this.lineTexts.values()
      ).flat();

      for (let i = 0; i < lineTextArr.length; i++) {
        const lineText = lineTextArr[i];

        let targetIndex: number | null = null;

        if (
          lineText.endIndex >= this._cursorIndex ||
          i === lineTextArr.length - 1
        ) {
          if (i === 0) {
            targetIndex = 0;
          } else {
            targetIndex = lineText.endIndex - lineText.text.length + 1;
          }

          if (event.shiftKey) {
            for (let i = this._cursorIndex - 1; i >= targetIndex; i--) {
              this.updateSelectedIndex(i);
            }
          } else {
            this.clearSelectedIndex();
          }

          this.setPrevRowIndex(null);
          this.setCursorIndex(targetIndex);
          break;
        }
      }
    } else {
      if (event.shiftKey) {
        this.updateSelectedIndex(this._cursorIndex - 1);
      } else {
        this.clearSelectedIndex();
      }
      this.setPrevRowIndex(null);
      this.setCursorIndex(this._cursorIndex - 1);
    }
  };

  arrowRight = (event: KeyboardEvent) => {
    if (event.metaKey) {
      const lineTextArr: LineText[] = Array.from(
        this.lineTexts.values()
      ).flat();

      for (let i = 0; i < lineTextArr.length; i++) {
        const lineText = lineTextArr[i];

        if (lineText.endIndex >= this._cursorIndex) {
          const targetIndex =
            i === lineTextArr.length - 1
              ? lineText.endIndex + 1
              : lineText.endIndex;

          if (event.shiftKey) {
            for (let i = this._cursorIndex; i <= targetIndex - 1; i++) {
              this.updateSelectedIndex(i);
            }
          } else {
            this.clearSelectedIndex();
          }

          console.log(targetIndex);
          this.setPrevRowIndex(null);
          this.setCursorIndex(targetIndex);

          break;
        }
      }
    } else {
      if (event.shiftKey) {
        this.updateSelectedIndex(this._cursorIndex);
      } else {
        this.clearSelectedIndex();
      }
      this.setPrevRowIndex(null);
      this.setCursorIndex(this._cursorIndex + 1);
    }
  };

  keyDown(event: KeyboardEvent) {
    if (!functionKey.includes(event.key)) event.preventDefault();

    if (event.key.length === 1) {
      if (event.metaKey) {
        switch (event.code) {
          case "KeyR":
            location.reload();
            break;
          default:
            break;
        }
      } else {
        this.addText(event.key);

        return true;
      }
    } else {
      let result = false;

      switch (event.key) {
        case "Backspace":
          this.deleteText();
          result = true;
          break;
        case "Enter":
          this.enter();
          result = true;
          break;
        case "ArrowDown":
          result = this.clearSelectedIndex();
          this.arrowDown();
          break;
        case "ArrowUp":
          result = this.clearSelectedIndex();
          this.arrowUp();
          break;
        case "ArrowLeft":
          if (event.shiftKey || this._selectedIndex.size > 0) {
            result = true;
          }
          this.arrowLeft(event);
          break;
        case "ArrowRight":
          if (event.shiftKey || this._selectedIndex.size > 0) {
            result = true;
          }
          this.arrowRight(event);
          break;
        default:
          console.log(`Unhandled special key: ${event.key}`);
          break;
      }

      return result;
    }
  }

  notifyTextCleared() {
    window.dispatchEvent(new Event("notifyTextCleared", {}));
  }
}
