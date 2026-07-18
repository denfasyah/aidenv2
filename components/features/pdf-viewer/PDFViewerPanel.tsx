import { FileText } from "lucide-react"

interface PDFViewerPanelProps {
  fileInfo: {
    name: string
    size: number
    url: string
  } | null
}

export function PDFViewerPanel({ fileInfo }: PDFViewerPanelProps) {
  return (
    <div className="flex-1 flex flex-col w-full h-full">
      <div className="h-10 border-b border-border/50 bg-muted/30 flex items-center px-4 flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Interactive View Engine — PDF Mode
        </span>
      </div>
      <div className="flex-1 w-full bg-black/5 relative">
        {fileInfo?.url ? (
          <object
            data={fileInfo.url}
            type="application/pdf"
            className="absolute inset-0 w-full h-full"
          >
            <iframe
              src={fileInfo.url}
              className="w-full h-full border-0"
              title="PDF Viewer"
            />
          </object>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
            <FileText className="h-12 w-12 mb-4 opacity-20 text-destructive" />
            <p className="text-destructive font-medium">
              {fileInfo?.name?.startsWith("ERROR:")
                ? fileInfo.name
                : "File PDF tidak ditemukan atau telah dihapus."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
