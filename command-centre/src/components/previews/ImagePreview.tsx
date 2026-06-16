"use client";

import { FC, useState } from "react";
import { ZoomIn, Download } from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";

interface ImagePreviewProps {
  filename: string;
  storagePath: string;
  fileSize: number;
}

export const ImagePreview: FC<ImagePreviewProps> = ({
  filename,
  storagePath,
  fileSize,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const imageUrl = `/${storagePath}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{filename}</p>
          <p className="text-sm text-gray-600">{formatFileSize(fileSize)}</p>
        </div>
        <a
          href={imageUrl}
          download
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
        >
          <Download size={16} />
          Download
        </a>
      </div>

      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={imageUrl}
          alt={filename}
          className="w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-90"
          onClick={() => setIsZoomed(true)}
        />
      </div>

      {isZoomed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="max-w-4xl max-h-[90vh] overflow-auto rounded-lg">
            <img
              src={imageUrl}
              alt={filename}
              className="w-full h-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
