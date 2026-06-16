"use client";

import { FC } from "react";
import { Download, AlertCircle, File } from "lucide-react";
import { formatFileSize, SupportedFileType } from "@/lib/file-utils";

interface FileNotSupportedPreviewProps {
  filename: string;
  fileType: SupportedFileType;
  storagePath: string;
  fileSize: number;
}

export const FileNotSupportedPreview: FC<FileNotSupportedPreviewProps> = ({
  filename,
  fileType,
  storagePath,
  fileSize,
}) => {
  const fileUrl = `/${storagePath}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{filename}</p>
          <p className="text-sm text-gray-600">
            {fileType.toUpperCase()} • {formatFileSize(fileSize)}
          </p>
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

      <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <File size={48} className="text-yellow-600 mb-3" />
        <p className="text-gray-900 font-medium">Preview Not Available</p>
        <p className="text-sm text-gray-600 text-center mt-2 max-w-xs">
          {fileType === "dwg" &&
            "CAD drawings cannot be previewed in-browser. Download to view in AutoCAD or a compatible viewer."}
          {fileType === "pptx" &&
            "Presentation files cannot be previewed in-browser. Download to view in PowerPoint or a compatible viewer."}
        </p>
        <a
          href={fileUrl}
          download
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          <Download size={18} />
          Download File
        </a>
      </div>
    </div>
  );
};
