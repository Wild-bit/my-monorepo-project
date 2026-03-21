import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface ImagePreviewProps {
  src: string
  alt?: string
  className?: string
}

function ImagePreview({ src, alt = "", className }: ImagePreviewProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        onClick={() => setOpen(true)}
        style={{ cursor: "zoom-in" }}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="max-w-[90vw] sm:max-w-[80vw] lg:max-w-[60vw] bg-black/80 backdrop-blur-xl border-white/10 p-2"
          onClick={() => setOpen(false)}
        >
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <img
            src={src}
            alt={alt}
            className="w-full max-h-[80vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export { ImagePreview }
