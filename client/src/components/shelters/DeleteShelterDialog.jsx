import { useEffect, useMemo, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

const DeleteShelterDialog = ({
	isOpen,
	onClose,
	onConfirm,
	shelter,
	loading,
}) => {
	const dialogRef = useRef(null);

	const focusableSelector = useMemo(
		() =>
			'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
		[]
	);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const timer = window.setTimeout(() => {
			const firstFocusable = dialogRef.current?.querySelector(focusableSelector);
			firstFocusable?.focus?.();
		}, 0);

		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				if (!loading) {
					onClose?.();
				}
				return;
			}

			if (event.key !== "Tab") {
				return;
			}

			const focusableElements = dialogRef.current?.querySelectorAll(focusableSelector);

			if (!focusableElements || focusableElements.length === 0) {
				event.preventDefault();
				return;
			}

			const firstFocusableElement = focusableElements[0];
			const lastFocusableElement = focusableElements[focusableElements.length - 1];

			if (event.shiftKey && document.activeElement === firstFocusableElement) {
				event.preventDefault();
				lastFocusableElement?.focus?.();
				return;
			}

			if (!event.shiftKey && document.activeElement === lastFocusableElement) {
				event.preventDefault();
				firstFocusableElement?.focus?.();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			window.clearTimeout(timer);
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = previousOverflow;
		};
	}, [focusableSelector, isOpen, loading, onClose]);

	if (!isOpen) {
		return null;
	}

	const handleBackdropClick = () => {
		if (loading) {
			return;
		}

		onClose?.();
	};

	const handleBackdropMouseDown = (event) => {
		if (event.target === event.currentTarget) {
			handleBackdropClick();
		}
	};

	const handleDialogMouseDown = (event) => {
		event.stopPropagation();
	};

	const shelterName = shelter?.name || "Unnamed Shelter";
	const district = shelter?.district || "Unknown District";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
			<div
				className="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px]"
				onMouseDown={handleBackdropMouseDown}
			/>

			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="delete-shelter-dialog-title"
				className="relative z-10 w-full max-w-lg animate-[fadeIn_180ms_ease-out] rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)],0,0,0.6)]"
				onMouseDown={handleDialogMouseDown}
			>
				<div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
					<div className="flex items-start gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
							<AlertTriangle className="h-5 w-5" />
						</div>

						<div>
							<h2 id="delete-shelter-dialog-title" className="text-2xl font-semibold tracking-tight text-slate-900">
								Delete Shelter
							</h2>
							<p className="mt-1 text-sm text-slate-500">
								Are you sure you want to permanently delete this shelter?
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						disabled={loading}
						className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
						aria-label="Close dialog"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="space-y-5 px-6 py-6 sm:px-8">
					<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
							<div>
								<div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
									Shelter Name
								</div>
								<div className="mt-2 font-semibold text-slate-900">{shelterName}</div>
							</div>
							<div>
								<div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
									District
								</div>
								<div className="mt-2 font-semibold text-slate-900">{district}</div>
							</div>
						</div>
					</div>

					<p className="text-sm text-slate-700">
						This action cannot be undone.
					</p>
				</div>

				<div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
					<button
						type="button"
						onClick={onClose}
						disabled={loading}
						className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
					>
						{loading ? "Deleting..." : "Delete Shelter"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default DeleteShelterDialog;
