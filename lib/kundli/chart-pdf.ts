const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = 794;

export async function downloadChartAsPdf(
  paper: HTMLElement,
  subjectName?: string,
) {
  await document.fonts?.ready;

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(paper, {
    backgroundColor: "#fbf6e9",
    logging: false,
    scale: 2,
    useCORS: true,
    windowWidth: 1024,
    onclone: (_document, clonedPaper) => {
      clonedPaper.style.width = `${A4_WIDTH_PX}px`;
      clonedPaper.style.maxWidth = "none";
      clonedPaper.style.minHeight = `${Math.round(
        (A4_WIDTH_PX * A4_HEIGHT_MM) / A4_WIDTH_MM,
      )}px`;
    },
  });

  const pdf = new jsPDF({
    compress: true,
    format: "a4",
    orientation: "portrait",
    unit: "mm",
  });
  const scale = Math.min(
    A4_WIDTH_MM / canvas.width,
    A4_HEIGHT_MM / canvas.height,
  );
  const width = canvas.width * scale;
  const height = canvas.height * scale;

  pdf.addImage(
    canvas.toDataURL("image/jpeg", 0.96),
    "JPEG",
    (A4_WIDTH_MM - width) / 2,
    (A4_HEIGHT_MM - height) / 2,
    width,
    height,
    undefined,
    "FAST",
  );
  pdf.save(buildChartPdfFilename(subjectName));
}

export function buildChartPdfFilename(subjectName?: string) {
  const safeName = subjectName
    ?.trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return `${safeName || "birth-chart"}.pdf`;
}
