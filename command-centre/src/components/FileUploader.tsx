"use client";

import { FC, useState, useRef } from "react";
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import { validateFile, formatFileSize, getAllowedMimeTypes } from "@/lib/file-utils";

interface FileUploaderProps {
  sessionId: string;
  userEmail?: string;
  onFileUploaded?: (fileId: string, filename: string, fileType: string) => void;
}

interface UploadedFile {
  fileId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export const FileUploader: FC<FileUploaderProps> = ({
  sessionId,
  userEmail,
  onFileUploaded,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);
      if (userEmail) {
        formData.append("userEmail", userEmail);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      const newFile: UploadedFile = {
        fileId: data.fileId,
        filename: data.filename,
        fileType: data.fileType,
        fileSize: data.fileSize,
        uploadedAt: data.uploadedAt,
      };

      setUploadedFiles([...uploadedFiles, newFile]);
      if (onFileUploaded) {
        onFileUploaded(data.fileId, data.filename, data.fileType);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAllowedMimeTypes()}
          onChange={handleInputChange}
          disabled={uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <Upload size={32} className="text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">
              Drag files here or{" "}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
              >
                click to browse
              </button>
            </p>
            <p className="text-sm text-gray-500">
              Supported: Spreadsheets, PDFs, CAD, Presentations, Images, Videos
            </p>
          </div>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="inline-block animate-spin">⏳</div>
            <p className="text-sm text-gray-600 mt-2">Uploading...</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Upload failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900">Uploaded Files</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.fileId}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file.filename}</p>
                    <p className="text-xs text-gray-600">
                      {file.fileType.toUpperCase()} • {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setUploadedFiles(
                      uploadedFiles.filter((f) => f.fileId !== file.fileId)
                    )
                  }
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
