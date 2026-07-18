/**
 * Utility for downloading PDF files as a Buffer for Multimodal AI.
 */

/**
 * Downloads a file from a given URL and returns its ArrayBuffer.
 * This buffer will be fed directly to Gemini so it can "see" the PDF (Multimodal Vision).
 * @param fileUrl - Signed URL for the PDF in Supabase Storage.
 */
export async function downloadPdfBuffer(fileUrl: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.error("Failed to fetch PDF:", response.statusText);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  } catch (error) {
    console.error("Error downloading PDF:", error);
    return null;
  }
}
