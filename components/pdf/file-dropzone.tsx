"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export function FileDropzone({ files, onFilesChange, maxFiles = 7 }: FileDropzoneProps) {
  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      onFilesChange([...files, ...acceptedFiles]);
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const handleUpgrade = () => {
    // यहाँ आगे चलकर हम पेमेंट गेटवे या प्राइसिंग पेज से जोड़ेंगे
    alert("Free limit of 7 files reached! Please upgrade to Pro to add more files.");
  };

  return (
    <div className="w-full space-y-4">
      {files.length >= maxFiles ? (
        // Limit Reached View
        <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-primary/50 bg-primary/5 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Free Limit Reached</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You can only merge up to {maxFiles} files for free.
          </p>
          <Button onClick={handleUpgrade} className="gradient-primary text-white">
            Buy Now to Upgrade
          </Button>
        </div>
      ) : (
        // Dropzone View
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
            {isDragActive ? "Drop files here..." : "Drag & drop PDF files here, or click to browse"}
          </p>
          <p className="text-sm text-muted-foreground text-center px-4">
            Only PDF files are supported. (Max {maxFiles} files for free)
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
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <File className="w-5 h-5 text-red-500" />
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