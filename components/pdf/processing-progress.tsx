import { CheckCircle2, LoaderCircle, AlertCircle } from "lucide-react";

export type ProcessingStatus = "idle" | "processing" | "completed" | "error";

type ProcessingProgressProps = {
  progress: number;
  status: ProcessingStatus;
  label?: string;
  detail?: string;
};

export function ProcessingProgress({ progress, status, label, detail }: ProcessingProgressProps) {
  const safeProgress = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  const title = label || (status === "completed" ? "Processing complete" : status === "error" ? "Processing failed" : status === "processing" ? "Processing your file" : "Ready when you are");
  return (
    <section className={`processing-card processing-${status}`} aria-live="polite">
      <div className="processing-card-heading">
        <span className="processing-status-icon">
          {status === "completed" ? <CheckCircle2 size={19}/> : status === "error" ? <AlertCircle size={19}/> : status === "processing" ? <LoaderCircle className="spin" size={19}/> : <span className="processing-idle-dot"/>}
        </span>
        <div className="processing-copy"><strong>{title}</strong>{detail && <small>{detail}</small>}</div>
        <b className="processing-percent">{status === "completed" ? "100%" : `${Math.round(safeProgress)}%`}</b>
      </div>
      <div className="processing-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={status === "completed" ? 100 : Math.round(safeProgress)}><span style={{ width: `${status === "completed" ? 100 : safeProgress}%` }}/></div>
    </section>
  );
}
