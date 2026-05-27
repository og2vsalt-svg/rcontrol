interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-sm rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-5">
        <h3 className="text-[14px] font-medium text-white">{title}</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-[#888]">{message}</p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-white/[0.08] px-4 py-2 text-[12px] text-[#888] transition-colors hover:border-white/20 hover:text-white"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-[12px] font-medium transition-colors ${
              danger
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
