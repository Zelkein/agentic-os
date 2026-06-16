"use client";

import { FC } from "react";
import { SupportedFileType } from "@/lib/file-utils";
import { ImagePreview } from "./previews/ImagePreview";
import { SpreadsheetPreview } from "./previews/SpreadsheetPreview";
import { PdfPreview } from "./previews/PdfPreview";
import { VideoPreview } from "./previews/VideoPreview";
import { FileNotSupportedPreview } from "./previews/FileNotSupportedPreview";

interface FilePreviewProps {
  fileType: SupportedFileType;
  filename: string;
  storagePath: string;
  fileSize: number;
}

export const FilePreview: FC<FilePreviewProps> = ({
  fileType,
  filename,
  storagePath,
  fileSize,
}) => {
  switch (fileType) {
    case "image":
      return (
        <ImagePreview
          filename={filename}
          storagePath={storagePath}
          fileSize={fileSize}
        />
      );
    case "xlsx":
      return (
        <SpreadsheetPreview
          filename={filename}
          storagePath={storagePath}
          fileSize={fileSize}
        />
      );
    case "pdf":
      return (
        <PdfPreview
          filename={filename}
          storagePath={storagePath}
          fileSize={fileSize}
        />
      );
    case "video":
      return (
        <VideoPreview
          filename={filename}
          storagePath={storagePath}
          fileSize={fileSize}
        />
      );
    case "dwg":
    case "pptx":
    default:
      return (
        <FileNotSupportedPreview
          filename={filename}
          fileType={fileType}
          storagePath={storagePath}
          fileSize={fileSize}
        />
      );
  }
};
