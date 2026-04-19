import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  help?: string;
  children: ReactNode;
};

export default function Field({ children, help, label }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-13 font-medium text-ink2">{label}</label>
      {children}
      {help ? <p className="text-12 text-mute">{help}</p> : null}
    </div>
  );
}
