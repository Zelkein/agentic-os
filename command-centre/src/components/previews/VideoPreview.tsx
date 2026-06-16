"use client";

import { FC } from "react";
import { Download } from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";

interface VideoPreviewProps {
  filename: string;
  storagePath: string;
  fileSize: number;
}

export const VideoPreview: FC<VideoPreviewProps> = ({
  filename,
  storagePath,
  fileSize,
}) => {
  const videoUrl = `/${storagePath}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{filename}</p>
          <p className="text-sm text-gray-600">{formatFileSize(fileSize)}</p>
        </div>
        <a
          href={videoUrl}
          download
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
        >
          <Download size={16} />
          Download
        </a>
      </div>

      <video
        src={videoUrl}
        controls
        className="w-full bg-black rounded-lg"
        style={{ maxHeight: "400px" }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
