"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-glow hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(59,130,246,0.3)]",
        secondary:
          "bg-card text-foreground ring-1 ring-border/80 hover:bg-card/80",
        ghost: "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        subtle: "bg-white/5 text-foreground hover:bg-white/10",
        danger: "bg-danger/20 text-danger-foreground ring-1 ring-danger/30 hover:bg-danger/30",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        lg: "h-12 px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl border border-border/60 bg-card/90 shadow-panel backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-border/80 bg-background/70 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/80 focus:ring-2 focus:ring-primary/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-2xl border border-border/80 bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/80 focus:ring-2 focus:ring-primary/20",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn("text-sm font-medium text-foreground", className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
  {
    variants: {
      tone: {
        neutral: "border-border/70 bg-white/5 text-muted-foreground",
        primary: "border-primary/30 bg-primary/15 text-primary-foreground",
        success: "border-success/35 bg-success/15 text-success-foreground",
        warning: "border-warning/35 bg-warning/15 text-warning-foreground",
        danger: "border-danger/35 bg-danger/15 text-danger-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  children?: React.ReactNode;
}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ tone, className }))} {...props} />;
}

export function Separator(props: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>) {
  return <SeparatorPrimitive.Root className={cn("bg-border/70", props.className)} {...props} />;
}

export function Progress({ className, value = 0, ...props }: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>) {
  const safeValue = value ?? 0;
  return (
    <ProgressPrimitive.Root
      value={safeValue}
      className={cn("relative h-2 overflow-hidden rounded-full bg-white/8", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 transition-transform"
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export function ScrollArea({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <ScrollAreaPrimitive.Root className={cn("relative overflow-hidden", className)}>
      <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit]">{children}</ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="flex w-2 touch-none bg-transparent p-[1px]">
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-white/15" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}

export function Tabs(props: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root {...props} />;
}

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex rounded-2xl bg-white/5 p-1 text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-2xl px-3 py-2 text-sm font-medium transition data-[state=active]:bg-white data-[state=active]:text-slate-950",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-4 outline-none", className)} {...props} />;
}

export function Switch(props: React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border/80 bg-white/10 transition data-[state=checked]:bg-primary",
        props.className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition data-[state=checked]:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  );
}

export function Select(props: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root {...props} />;
}

export function SelectTrigger({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-2xl border border-border/80 bg-background/70 px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectValue(props: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value {...props} />;
}

export function SelectContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn("z-50 overflow-hidden rounded-2xl border border-border/80 bg-slate-950 p-1 shadow-panel", className)}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn("rounded-xl px-3 py-2 text-sm text-foreground outline-none hover:bg-white/5", className)}
      {...props}
    >
      <SelectPrimitive.ItemText />
    </SelectPrimitive.Item>
  );
}

export function Dialog({ ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />;
}

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(96vw,46rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border/80 bg-slate-950/95 p-6 shadow-panel outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-xl font-semibold text-foreground", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={80}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({
  content,
  children,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={8}
          className="z-50 rounded-2xl border border-border/80 bg-slate-950 px-3 py-2 text-xs text-foreground shadow-panel"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export function HoverCard({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <HoverCardPrimitive.Root openDelay={120} closeDelay={80}>
      <HoverCardPrimitive.Trigger asChild>{trigger}</HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content className="z-50 w-80 rounded-3xl border border-border/80 bg-slate-950/95 p-4 shadow-panel">
          {children}
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-2xl bg-white/8", className)} {...props} />;
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-border/60 align-top">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-4 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
