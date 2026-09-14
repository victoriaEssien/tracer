import { describe, expect, it } from "vitest";

import { looksEnglish } from "./language";

describe("looksEnglish", () => {
  it("reads ordinary English prose as English", () => {
    expect(
      looksEnglish(
        "The importer drops the last row of a CSV when the file has no trailing newline, " +
          "which means the count is always one short and nobody notices until later.",
      ),
    ).toBe(true);
  });

  it.each([
    [
      "Spanish",
      "El importador descarta la última fila de un CSV cuando el archivo no termina " +
        "con un salto de línea, así que el recuento siempre queda corto por uno.",
    ],
    [
      "Portuguese",
      "O importador descarta a última linha de um CSV quando o arquivo não termina " +
        "com uma quebra de linha, então a contagem fica sempre menor por um.",
    ],
    [
      "German",
      "Der Importer verwirft die letzte Zeile einer CSV-Datei, wenn die Datei nicht " +
        "mit einem Zeilenumbruch endet, wodurch die Zählung immer um eins zu niedrig ist.",
    ],
    ["Japanese", "ファイルが改行で終わっていない場合、インポーターは CSV の最後の行を破棄します。"],
    ["Russian", "Импортер отбрасывает последнюю строку CSV, если файл не заканчивается переводом строки."],
  ])("does not read %s as English", (_language, text) => {
    expect(looksEnglish(text)).toBe(false);
  });

  it("is not fooled by the English identifiers inside a code block", () => {
    const body = [
      "インポーターが最後の行を落とします。再現手順は以下のとおりです。",
      "",
      "```ts",
      "const rows = parse(file);",
      "if (!file.endsWith('\\n')) rows.pop();",
      "```",
    ].join("\n");

    expect(looksEnglish(body)).toBe(false);
  });

  it("still reads an English issue that is mostly code", () => {
    const body = [
      "This throws when the file has no trailing newline, and it should not.",
      "",
      "```ts",
      "const rows = parse(file);",
      "```",
    ].join("\n");

    expect(looksEnglish(body)).toBe(true);
  });

  it("assumes a very short body reads, rather than guessing from four words", () => {
    expect(looksEnglish("Crash on startup")).toBe(true);
    expect(looksEnglish("")).toBe(true);
  });

  it("tolerates a stack trace or a log pasted into an English issue", () => {
    const body = [
      "The importer throws on a file with no trailing newline. Here is what it prints when it happens:",
      "",
      "```",
      "TypeError: Cannot read properties of undefined (reading 'length')",
      "    at parseRows (/app/src/import/rows.js:44:19)",
      "```",
    ].join("\n");

    expect(looksEnglish(body)).toBe(true);
  });
});
