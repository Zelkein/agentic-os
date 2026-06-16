"use client";

import { Download, AlertCircle } from "lucide-react";

interface Props {
  filename: string;
  url: string;
}

export default function PresentationPreview({ filename, url }: Props) {
  return (
    <div className="bg-white border rounded p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">📈 {filename}</h3>
          <p className="text-sm text-gray-600">PowerPoint Presentation</p>
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

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 flex gap-3">
        <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-yellow-800 font-semibold mb-2">
            PowerPoint preview not yet available
          </p>
          <p className="text-sm text-yellow-700 mb-3">
            Download the file to view the presentation, or open it with your preferred Office application.
          </p>
          <button
            onClick={() => window.open(url, "_blank")}
            className="text-yellow-700 hover:underline text-sm font-semibold"
          >
            Open in new tab
          </button>
        </div>
      </div>
    </div>
  );
}
