"use client";

import { Download, AlertCircle } from "lucide-react";
import { SupportedFileType } from "@/lib/file-utils";

interface Props {
  filename: string;
  type: SupportedFileType;
  url: string;
}

const TYPE_ICONS: Record<SupportedFileType, string> = {
  xlsx: "📊",
  pdf: "📄",
  dwg: "🏗️",
  pptx: "📈",
  image: "🖼️",
  video: "🎥",
};

export default function DefaultPreview({ filename, type, url }: Props) {
  return (
    <div className="bg-white border rounded p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">
            {TYPE_ICONS[type]} {filename}
          </h3>
          <p className="text-sm text-gray-600">{type.toUpperCase()} File</p>
        </div>
        <a
          href={url}
          download
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
        >
          <Download size={16} />
          Download
        </a>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-6 text-center">
        <AlertCircle size={32} className="mx-auto mb-3 text-gray-600" />
        <p className="font-semibold text-gray-800 mb-2">
          {type.toUpperCase()} File
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Preview not available for this file type. Please download to view.
        </p>
        <a
          href={url}
          download
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          Download File
        </a>
      </div>
    </div>
  );
}
