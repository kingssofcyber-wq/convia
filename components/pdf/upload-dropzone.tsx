"use client";

import { useRef, useState } from "react";
import { FileUp, FileText, X } from "lucide-react";

type UploadDropzoneProps = {
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  title?: string;
  hint?: string;
};

export function UploadDropzone({ accept = "application/pdf,.pdf", multiple = false, onFilesSelected, title = "Choose a PDF file", hint = "or drag and drop it here" }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const choose = (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list);
    setFileNames(files.map((file) => file.name));
    onFilesSelected(files);
  };
  return (
    <div className={`upload-dropzone ${dragging ? "upload-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files); }}>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} hidden onChange={(event) => choose(event.target.files)}/>
      <div className="upload-icon"><FileUp size={26}/></div>
      <strong>{title}</strong><span>{hint}</span>
      <button type="button" className="button-primary" onClick={() => inputRef.current?.click()}>Browse files</button>
      <small>PDF files · Processed according to the selected tool</small>
      {fileNames.length > 0 && <div className="upload-file-list">{fileNames.map((name) => <span key={name}><FileText size={14}/>{name}</span>)}<button type="button" aria-label="Clear selected files" onClick={() => { setFileNames([]); if (inputRef.current) inputRef.current.value = ""; onFilesSelected([]); }}><X size={14}/></button></div>}
    </div>
  );
}
