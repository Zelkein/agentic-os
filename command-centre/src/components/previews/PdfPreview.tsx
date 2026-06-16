"use client";

import { FC } from "react";
import { Download, FileText } from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";

interface PdfPreviewProps {
  filename: string;
  storagePath: string;
  fileSize: number;
}

export const PdfPreview: FC<PdfPreviewProps> = ({
  filename,
  storagePath,
  fileSize,
}) => {
  const fileUrl = `/${storagePath}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{filename}</p>
          <p className="text-sm text-gray-600">{formatFileSize(fileSize)}</p>
        </div>
        <a
          href={fileUrl}
          download
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
        >
          <Download size={16} />
          Download
        </a>
      </div>

      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
        <FileText size={48} className="text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">PDF Document</p>
        <p className="text-sm text-gray-500 mt-1">
          Click the download button above to view the PDF
        </p>
        <p className="text-xs text-gray-400 mt-4">
          or open it in a new tab:
        </p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-blue-600 hover:text-blue-700 underline text-sm"
        >
          Open PDF in new tab
        </a>
      </div>
    </div>
  );
};
