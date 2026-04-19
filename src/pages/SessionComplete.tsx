import { Check } from "lucide-react";
import Button from "../components/Button";

export default function SessionComplete() {
  return (
    <div className="flex min-h-screen items-start justify-center px-6 py-20">
      <div className="w-full max-w-[620px] text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-forestSoft text-forest">
          <Check className="h-6 w-6" />
        </div>
        <h1 className="display mt-6 text-48 text-ink">Thank you, Aarav.</h1>
        <p className="mx-auto mt-4 max-w-[520px] text-15 text-mute">
          Your responses for Research Essay — Theories of Justice have been submitted. Your teacher will review them shortly.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-sm2 border border-line bg-hover px-2.5 py-1 text-12 text-ink">7 of 7 answered</span>
          <span className="rounded-sm2 border border-line bg-hover px-2.5 py-1 text-12 text-ink">12 minutes 03 seconds</span>
          <span className="rounded-sm2 border border-line bg-hover px-2.5 py-1 text-12 text-ink">Submitted just now</span>
        </div>
        <div className="mt-8">
          <Button variant="secondary">Download a copy of my responses</Button>
        </div>
        <div className="mt-8 rounded-xl2 border border-line bg-surface px-5 py-4 text-13 text-mute">
          If you need to flag an issue with this session, contact your teacher.
        </div>
      </div>
    </div>
  );
}
