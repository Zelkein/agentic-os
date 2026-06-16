export type SupportedFileType = "xlsx" | "pdf" | "dwg" | "pptx" | "image" | "video";

interface FileTypeConfig {
  mimeTypes: string[];
  extensions: string[];
  maxSizeMB: number;
  displayName: string;
}

const FILE_TYPE_CONFIG: Record<SupportedFileType, FileTypeConfig> = {
  xlsx: {
    mimeTypes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"],
    extensions: [".xlsx", ".xls"],
    maxSizeMB: 50,
    displayName: "Spreadsheet",
  },
  pdf: {
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
    maxSizeMB: 50,
    displayName: "PDF",
  },
  dwg: {
    mimeTypes: ["image/vnd.dwg", "application/vnd.dwg"],
    extensions: [".dwg"],
    maxSizeMB: 100,
    displayName: "CAD Drawing",
  },
  pptx: {
    mimeTypes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-powerpoint"],
    extensions: [".pptx", ".ppt"],
    maxSizeMB: 50,
    displayName: "Presentation",
  },
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    maxSizeMB: 25,
    displayName: "Image",
  },
  video: {
    mimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
    extensions: [".mp4", ".mov", ".webm"],
    maxSizeMB: 500,
    displayName: "Video",
  },
};

export function getSupportedFileTypes(): SupportedFileType[] {
  return Object.keys(FILE_TYPE_CONFIG) as SupportedFileType[];
}

export function getAllowedMimeTypes(): string {
  return Object.values(FILE_TYPE_CONFIG).flatMap((config) => config.mimeTypes).join(",");
}

export interface ValidationError {
  valid: false;
  error: string;
}

export interface ValidationSuccess {
  valid: true;
  fileType: SupportedFileType;
  fileName: string;
  fileSizeMB: number;
}

export function validateFile(file: File): ValidationSuccess | ValidationError {
  const fileSizeMB = file.size / (1024 * 1024);
  const maxAllowedMB = Math.max(...Object.values(FILE_TYPE_CONFIG).map((c) => c.maxSizeMB));

  if (fileSizeMB > maxAllowedMB) {
    return { valid: false, error: `File too large (${fileSizeMB.toFixed(1)}MB). Max ${maxAllowedMB}MB.` };
  }

  const ext = getFileExtension(file.name).toLowerCase();
  let detectedType: SupportedFileType | null = null;

  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.extensions.includes(ext) || config.mimeTypes.includes(file.type)) {
      detectedType = type as SupportedFileType;
      break;
    }
  }

  if (!detectedType) {
    const supported = Object.values(FILE_TYPE_CONFIG).map((c) => c.displayName).join(", ");
    return { valid: false, error: `File type not supported. Supported: ${supported}` };
  }

  const typeConfig = FILE_TYPE_CONFIG[detectedType];
  if (fileSizeMB > typeConfig.maxSizeMB) {
    return { valid: false, error: `${detectedType.toUpperCase()} file too large. Max ${typeConfig.maxSizeMB}MB.` };
  }

  return { valid: true, fileType: detectedType, fileName: file.name, fileSizeMB };
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot > 0 ? filename.substring(lastDot) : "";
}

export function getFileIcon(fileType: SupportedFileType): "FileText" | "File" | "Image" | "Film" | "Layers" {
  switch (fileType) {
    case "pdf": return "FileText";
    case "xlsx": return "Layers";
    case "image": return "Image";
    case "video": return "Film";
    case "dwg":
    case "pptx":
    default: return "File";
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function generateStorageFilename(originalFilename: string, sessionId: string): string {
  const timestamp = Date.now();
  const ext = getFileExtension(originalFilename);
  const nameWithoutExt = originalFilename.substring(0, originalFilename.length - ext.length);
  const sanitized = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${sanitized}-${timestamp}${ext}`;
}

export function generateStoragePath(sessionId: string, filename: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `uploads/${date}/${sessionId}/${filename}`;
}

export interface FileDisplayInfo {
  icon: string;
  displayName: string;
  description: string;
}

export function getFileDisplayInfo(fileType: SupportedFileType): FileDisplayInfo {
  const config = FILE_TYPE_CONFIG[fileType];
  return {
    icon: getFileIcon(fileType),
    displayName: config.displayName,
    description: `${config.displayName} (${config.extensions.join(", ")})`,
  };
}
