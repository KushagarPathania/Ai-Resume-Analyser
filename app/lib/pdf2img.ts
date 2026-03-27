export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      // Using the legacy build for better compatibility across bundlers
      const lib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      
      // Setting worker from UNPKG (more reliable for version matching)
      lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
      
      pdfjsLib = lib;
      return lib;
    } catch (error) {
      loadPromise = null; // Reset so we can try again on next call
      throw error;
    }
  })();

  return loadPromise;
}

export async function convertPdfToImage(
  file: File,
  scale: number = 2.0 // Defaulting to 2 for better balance of quality vs performance
): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the document
    const loadingTask = lib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get the first page
    const page = await pdf.getPage(1);

    // Setup viewport and canvas
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context not supported");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Optional: High-quality settings
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    // Render the PDF page into the canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert canvas to Blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to generate image blob",
            });
            return;
          }

          const originalName = file.name.replace(/\.[^/.]+$/, "");
          const imageFile = new File([blob], `${originalName}.png`, {
            type: "image/png",
          });

          resolve({
            imageUrl: URL.createObjectURL(blob),
            file: imageFile,
          });
        },
        "image/png",
        1.0 // Maximum quality
      );
    });
  } catch (err: any) {
    console.error("PDF Conversion Error:", err);
    return {
      imageUrl: "",
      file: null,
      error: err.message || "An unknown error occurred during conversion",
    };
  }
}