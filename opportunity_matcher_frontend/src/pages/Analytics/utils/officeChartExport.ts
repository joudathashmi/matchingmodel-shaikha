import PptxGenJS from "pptxgenjs";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
} from "docx";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export type OfficeChartKind = "bar" | "bar-horizontal" | "pie" | "doughnut";

export type OfficeChartSpec = {
  title: string;
  subtitle?: string;
  kind: OfficeChartKind;
  labels: string[];
  values: number[];
  seriesName?: string;
  unit?: string;
};

export function stampOfficeFilename(
  prefix: string,
  ext: "pptx" | "docx"
): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
  return `${prefix}_${stamp}.${ext}`;
}

function sanitizeLabels(labels: string[]): string[] {
  return labels.map((l) => String(l || "").slice(0, 80) || "—");
}

function sanitizeValues(values: number[]): number[] {
  return values.map((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });
}

/** Native editable PowerPoint chart (select chart → Edit Data). */
export async function exportChartsPptx(
  charts: OfficeChartSpec[],
  filename: string
): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.author = "MISA Investor Attraction";
  pptx.title = "Matching performance";
  pptx.subject = "Analytics export";

  const list = charts.filter((c) => c.labels.length && c.values.length);
  if (!list.length) throw new Error("No chart data to export");

  for (const chart of list) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addText(chart.title, {
      x: 0.4,
      y: 0.28,
      w: 9.2,
      h: 0.42,
      fontSize: 20,
      bold: true,
      color: "111827",
      fontFace: "Calibri",
    });
    if (chart.subtitle) {
      slide.addText(chart.subtitle, {
        x: 0.4,
        y: 0.68,
        w: 9.2,
        h: 0.32,
        fontSize: 12,
        color: "4B5563",
        fontFace: "Calibri",
      });
    }

    const labels = sanitizeLabels(chart.labels);
    const values = sanitizeValues(chart.values);
    const seriesName = chart.seriesName || "Value";
    const y = chart.subtitle ? 1.1 : 0.9;

    slide.addChart(
      pptxChartType(pptx, chart.kind),
      [{ name: seriesName, labels, values }],
      {
        x: 0.4,
        y,
        w: 9.2,
        h: 4.55,
        showTitle: false,
        showLegend: chart.kind === "pie" || chart.kind === "doughnut",
        showValue: false,
        chartColors: ["0F766E", "0E7490", "0369A1", "1D4ED8", "B45309", "B91C1C"],
        barGrouping: "clustered",
      }
    );
  }

  const name = filename.endsWith(".pptx") ? filename : `${filename}.pptx`;
  await pptx.writeFile({ fileName: name });
}

function pptxChartType(pptx: PptxGenJS, kind: OfficeChartKind) {
  // ChartType: bar = column/bar family; pie / doughnut as named.
  if (kind === "pie") return pptx.ChartType.pie;
  if (kind === "doughnut") return pptx.ChartType.doughnut;
  // Vertical columns vs horizontal bars — pptxgenjs uses `bar` for both;
  // horizontal is selected via options when available. Default bar = column.
  return pptx.ChartType.bar;
}

/**
 * Word export with native DrawingML charts + editable source tables.
 * In Word: click chart → Chart Design → Edit Data.
 */
export async function exportChartsDocx(
  charts: OfficeChartSpec[],
  filename: string
): Promise<void> {
  const list = charts.filter((c) => c.labels.length && c.values.length);
  if (!list.length) throw new Error("No chart data to export");

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: "Matching performance",
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Each chart is an Office chart. Select it in Word, then Chart Design → Edit Data to change values.",
          italics: true,
          size: 18,
          color: "4B5563",
        }),
      ],
    }),
  ];

  list.forEach((chart, i) => {
    children.push(
      new Paragraph({
        text: chart.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: i === 0 ? 120 : 280 },
      })
    );
    if (chart.subtitle) {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: chart.subtitle, color: "4B5563", size: 20 }),
          ],
        })
      );
    }
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `__CHART_${i}__` })],
      })
    );
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: "Source data (editable table)",
            bold: true,
            size: 20,
          }),
        ],
      })
    );
    children.push(dataTable(chart));
  });

  const base = new Document({ sections: [{ children }] });
  const baseBlob = await Packer.toBlob(base);
  const zip = await JSZip.loadAsync(baseBlob);

  let documentXml = await zip.file("word/document.xml")!.async("string");
  const relsPath = "word/_rels/document.xml.rels";
  let relsXml = await zip.file(relsPath)!.async("string");
  let contentTypes = await zip.file("[Content_Types].xml")!.async("string");
  let nextRid = maxRelationshipId(relsXml) + 1;

  for (let i = 0; i < list.length; i++) {
    const chart = list[i];
    const chartPath = `word/charts/chart${i + 1}.xml`;
    const rid = `rId${nextRid++}`;
    zip.file(chartPath, buildChartXml(chart));

    relsXml = injectRelationship(
      relsXml,
      rid,
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart",
      `charts/chart${i + 1}.xml`
    );

    if (!contentTypes.includes(`/${chartPath}`)) {
      contentTypes = contentTypes.replace(
        "</Types>",
        `  <Override PartName="/${chartPath}" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>\n</Types>`
      );
    }

    const marker = `__CHART_${i}__`;
    const drawingRun = chartDrawingXml(rid, chart.title);
    const paraRe = new RegExp(
      `<w:p[^>]*>[\\s\\S]*?${marker}[\\s\\S]*?</w:p>`
    );
    if (paraRe.test(documentXml)) {
      documentXml = documentXml.replace(paraRe, `<w:p>${drawingRun}</w:p>`);
    } else if (documentXml.includes(marker)) {
      documentXml = documentXml.replace(
        marker,
        `</w:t></w:r>${drawingRun}<w:r><w:t>`
      );
    }
  }

  zip.file("word/document.xml", documentXml);
  zip.file(relsPath, relsXml);
  zip.file("[Content_Types].xml", contentTypes);

  const out = await zip.generateAsync({ type: "blob" });
  const name = filename.endsWith(".docx") ? filename : `${filename}.docx`;
  saveAs(out, name);
}

function dataTable(chart: OfficeChartSpec): Table {
  const border = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: "D1D5DB",
  };
  const borders = { top: border, bottom: border, left: border, right: border };
  const valueHeader = chart.seriesName
    ? chart.seriesName
    : chart.unit
      ? `Value (${chart.unit})`
      : "Value";
  const header = new TableRow({
    children: [cell("Category", borders, true), cell(valueHeader, borders, true)],
  });
  const values = sanitizeValues(chart.values);
  const rows = chart.labels.map(
    (label, idx) =>
      new TableRow({
        children: [
          cell(String(label), borders),
          cell(String(values[idx] ?? 0), borders),
        ],
      })
  );
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [header, ...rows],
  });
}

function cell(text: string, borders: any, bold = false): TableCell {
  return new TableCell({
    borders,
    width: { size: 4500, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 18 })],
      }),
    ],
  });
}

function maxRelationshipId(relsXml: string): number {
  const ids: number[] = [];
  const re = /Id="rId(\d+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(relsXml))) ids.push(Number(m[1]));
  return ids.length ? Math.max(...ids) : 1;
}

function injectRelationship(
  relsXml: string,
  rid: string,
  type: string,
  target: string
): string {
  const tag = `<Relationship Id="${rid}" Type="${type}" Target="${target}"/>`;
  if (relsXml.includes(`Id="${rid}"`)) return relsXml;
  return relsXml.replace("</Relationships>", `  ${tag}\n</Relationships>`);
}

function chartDrawingXml(rid: string, title: string): string {
  const safe = escapeXml(title);
  return `<w:r>
  <w:drawing>
    <wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="5486400" cy="3200400"/>
      <wp:effectExtent l="0" t="0" r="0" b="0"/>
      <wp:docPr id="${Math.floor(Math.random() * 100000)}" name="${safe}"/>
      <wp:cNvGraphicFramePr/>
      <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="${rid}"/>
        </a:graphicData>
      </a:graphic>
    </wp:inline>
  </w:drawing>
</w:r>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildChartXml(chart: OfficeChartSpec): string {
  const labels = sanitizeLabels(chart.labels);
  const values = sanitizeValues(chart.values);
  const seriesName = escapeXml(chart.seriesName || "Value");
  const title = escapeXml(chart.title);
  const catPts = labels
    .map((l, i) => `<c:pt idx="${i}"><c:v>${escapeXml(l)}</c:v></c:pt>`)
    .join("");
  const valPts = values
    .map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`)
    .join("");
  const n = labels.length;

  const series = `
    <c:ser>
      <c:idx val="0"/>
      <c:order val="0"/>
      <c:tx><c:v>${seriesName}</c:v></c:tx>
      <c:cat>
        <c:strLit>
          <c:ptCount val="${n}"/>
          ${catPts}
        </c:strLit>
      </c:cat>
      <c:val>
        <c:numLit>
          <c:formatCode>General</c:formatCode>
          <c:ptCount val="${n}"/>
          ${valPts}
        </c:numLit>
      </c:val>
    </c:ser>`;

  let plot: string;
  if (chart.kind === "pie" || chart.kind === "doughnut") {
    const tag = chart.kind === "doughnut" ? "doughnutChart" : "pieChart";
    const hole = chart.kind === "doughnut" ? `<c:holeSize val="55"/>` : "";
    plot = `
      <c:${tag}>
        ${series}
        <c:dLbls>
          <c:showLegendKey val="0"/>
          <c:showVal val="0"/>
          <c:showCatName val="1"/>
          <c:showPercent val="1"/>
          <c:showSerName val="0"/>
        </c:dLbls>
        ${hole}
      </c:${tag}>`;
  } else {
    const barDir = chart.kind === "bar-horizontal" ? "bar" : "col";
    plot = `
      <c:barChart>
        <c:barDir val="${barDir}"/>
        <c:grouping val="clustered"/>
        ${series}
        <c:axId val="1"/>
        <c:axId val="2"/>
      </c:barChart>
      <c:catAx>
        <c:axId val="1"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="${barDir === "bar" ? "l" : "b"}"/>
        <c:tickLblPos val="nextTo"/>
        <c:crossAx val="2"/>
      </c:catAx>
      <c:valAx>
        <c:axId val="2"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="${barDir === "bar" ? "b" : "l"}"/>
        <c:majorGridlines/>
        <c:tickLblPos val="nextTo"/>
        <c:crossAx val="1"/>
      </c:valAx>`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:chart>
    <c:title>
      <c:tx>
        <c:rich>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:pPr><a:defRPr sz="1400" b="1"/></a:pPr>
            <a:r><a:t>${title}</a:t></a:r>
          </a:p>
        </c:rich>
      </c:tx>
      <c:overlay val="0"/>
    </c:title>
    <c:autoTitleDeleted val="0"/>
    <c:plotArea>
      <c:layout/>
      ${plot}
    </c:plotArea>
    <c:legend>
      <c:legendPos val="b"/>
      <c:overlay val="0"/>
    </c:legend>
    <c:plotVisOnly val="1"/>
  </c:chart>
</c:chartSpace>`;
}

export async function exportSingleChart(
  chart: OfficeChartSpec,
  kind: "pptx" | "docx",
  filePrefix: string
): Promise<void> {
  const name = stampOfficeFilename(filePrefix, kind);
  if (kind === "pptx") await exportChartsPptx([chart], name);
  else await exportChartsDocx([chart], name);
}
