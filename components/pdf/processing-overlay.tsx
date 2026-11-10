"use client";

import { X, LoaderCircle, CheckCircle2, AlertCircle } from "lucide-react";
import type { ProcessingStatus } from "@/components/pdf/processing-progress";

type ProcessingOverlayProps = {
  open: boolean;
  progress: number;
  status: ProcessingStatus;
  title?: string;
  message?: string;
  onClose?: () => void;
};

export function ProcessingOverlay({ open, progress, status, title = "Working on your PDF", message = "Please keep this tab open while your file is being processed.", onClose }: ProcessingOverlayProps) {
  if (!open) return null;
  const value = status === "completed" ? 100 : Math.max(0, Math.min(100, progress));
  return (
    <div className="processing-overlay" role="dialog" aria-modal="true" aria-labelledby="processing-title">
      <div className="processing-dialog">
        {onClose && <button className="processing-close" onClick={onClose} type="button" aria-label="Close"><X size={18}/></button>}
        <div className={`processing-dialog-icon processing-${status}`}>{status === "completed" ? <CheckCircle2 size={27}/> : status === "error" ? <AlertCircle size={27}/> : <LoaderCircle className={status === "processing" ? "spin" : ""} size={27}/>}</div>
        <h2 id="processing-title">{status === "completed" ? "Your PDF is ready" : status === "error" ? "Something needs attention" : title}</h2>
        <p>{message}</p>
        <div className="processing-dialog-track"><span style={{ width: `${value}%` }}/></div>
        <div className="processing-dialog-meta"><span>{status === "completed" ? "Completed" : status === "error" ? "Please try again" : "Processing"}</span><strong>{Math.round(value)}%</strong></div>
      </div>
    </div>
  );
}
