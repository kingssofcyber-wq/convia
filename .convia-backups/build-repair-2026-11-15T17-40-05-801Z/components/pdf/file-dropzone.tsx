"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptType?: "pdf" | "image";
  title?: string;
  subtitle?: string;
}

export function FileDropzone({ 
  files, 
  onFilesChange, 
  maxFiles = 7, 
  acceptType = "pdf",
  title,
  subtitle
}: FileDropzoneProps) {
  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      onFilesChange([...files, ...acceptedFiles]);
    },
    [files, onFilesChange]
  );

  // यहाँ हम टाइप के हिसाब से फाइल एक्सेप्ट कर रहे हैं
  const acceptConfig = acceptType === "pdf" 
    ? { "application/pdf": [".pdf"] } 
    : { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptConfig,
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  return (
    <div className="w-full space-y-4">
      {files.length >= maxFiles ? (
        <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-primary/50 bg-primary/5 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <span className="text-2xl">🛑</span>
          </div>
          <h3 className="text-lg font-bold mb-1">Limit Reached</h3>
          <p className="text-sm text-muted-foreground mb-4">You can only use up to {maxFiles} files.</p>
          <Button onClick={() => alert("Redirecting to Pricing Page...")} className="gradient-primary text-white">
            Buy Now to Upgrade
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
            isDragActive ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-semibold mb-1 text-center px-4">
            {isDragActive ? "Drop files here..." : (title || `Drag & drop ${acceptType === 'pdf' ? 'PDF' : 'Image'} files here`)}
          </p>
          <p className="text-sm text-muted-foreground text-center px-4">
            {subtitle || `Max ${maxFiles} files for free.`}
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2 mt-6">
          <h4 className="text-sm font-semibold mb-3">Selected files ({files.length}/{maxFiles})</h4>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${acceptType === 'pdf' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {acceptType === 'pdf' ? <File className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => removeFile(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}