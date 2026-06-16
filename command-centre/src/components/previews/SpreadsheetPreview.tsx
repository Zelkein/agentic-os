"use client";

import { FC, useEffect, useState } from "react";
import { Download, AlertCircle } from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";

interface SpreadsheetPreviewProps {
  filename: string;
  storagePath: string;
  fileSize: number;
}

interface SheetData {
  sheets: string[];
  data: (string | number)[][];
  activeSheet: number;
}

export const SpreadsheetPreview: FC<SpreadsheetPreviewProps> = ({
  filename,
  storagePath,
  fileSize,
}) => {
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileUrl = `/${storagePath}`;

  useEffect(() => {
    const loadSpreadsheet = async () => {
      try {
        // For now, show a placeholder for spreadsheet preview
        // In a real app, we'd use a library like xlsx to parse the file
        setSheetData({
          sheets: ["Sheet1"],
          data: [
            ["Loading spreadsheet preview..."],
            ["To enable full preview, install xlsx library"],
          ],
          activeSheet: 0,
        });
      } catch (err) {
        setError("Unable to load spreadsheet preview");
      } finally {
        setLoading(false);
      }
    };

    loadSpreadsheet();
  }, [fileUrl]);

  if (loading) {
    return <div className="text-gray-600">Loading spreadsheet...</div>;
  }

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

      {error && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle size={18} className="text-yellow-600" />
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      )}

      {sheetData && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <tbody>
              {sheetData.data.slice(0, 20).map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  {row.slice(0, 10).map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="px-4 py-2 border-r border-gray-200 text-gray-900"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-600">
        Preview limited to first 20 rows. Download to view full spreadsheet.
      </p>
    </div>
  );
};
