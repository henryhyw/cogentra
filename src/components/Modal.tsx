import { X } from "lucide-react";
import type { ReactNode } from "react";
import IconButton from "./IconButton";

type ModalProps = {
  children: ReactNode;
  footer?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export default function Modal({ children, footer, isOpen, onClose, title }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6">
      <div className="w-full max-w-lg rounded-xl2 border border-line bg-surface shadow-e3 transition-transform duration-220 ease-out">
        <div className="flex h-14 items-center justify-between border-b border-line px-5">
          <h3 className="text-16 font-medium text-ink">{title}</h3>
          <IconButton aria-label="Close dialog" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
