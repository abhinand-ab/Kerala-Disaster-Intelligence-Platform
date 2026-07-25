/**
 * BaseModal – reusable accessible dark-mode-aware dialog shell.
 *
 * Props:
 *   isOpen        boolean
 *   onClose       () => void
 *   title         string
 *   subtitle      string (optional)
 *   children      ReactNode – form body
 *   footer        ReactNode – action buttons
 *   maxWidth      string (default "max-w-3xl")
 *   loading       boolean
 *   titleId       string (aria-labelledby id, must be unique per modal)
 */
import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";

const BaseModal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer,
    maxWidth = "max-w-3xl",
    loading = false,
    titleId = "base-modal-title",
}) => {
    const modalRef = useRef(null);

    const focusableSelector = useMemo(
        () =>
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        []
    );

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const timer = window.setTimeout(() => {
            modalRef.current?.querySelector(focusableSelector)?.focus?.();
        }, 0);

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                if (!loading) onClose?.();
                return;
            }
            if (event.key !== "Tab") return;

            const focusableEls = modalRef.current?.querySelectorAll(focusableSelector);
            if (!focusableEls?.length) { event.preventDefault(); return; }

            const first = focusableEls[0];
            const last = focusableEls[focusableEls.length - 1];

            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus?.(); return; }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus?.(); }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, loading, onClose, focusableSelector]);

    if (!isOpen) return null;

    const handleBackdropMouseDown = (e) => {
        if (e.target === e.currentTarget && !loading) onClose?.();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6"
            aria-hidden="false"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px]"
                onMouseDown={handleBackdropMouseDown}
            />

            {/* Panel */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`relative z-10 w-full ${maxWidth} animate-[fadeIn_180ms_ease-out] rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)],0,0,0.6)]`}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
                    <div>
                        <h2 id={titleId} className="text-2xl font-semibold tracking-tight text-slate-900">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[70vh] overflow-y-auto px-6 py-6 sm:px-8">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export const ModalCancelButton = ({ onClick, disabled, children = "Cancel" }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
        {children}
    </button>
);

export const ModalSubmitButton = ({ form, disabled, loading, label, destructive = false }) => (
    <button
        type="submit"
        form={form}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${destructive
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-cyan-500 hover:bg-cyan-600"
            }`}
    >
        {loading ? "Saving..." : label}
    </button>
);

export default BaseModal;
