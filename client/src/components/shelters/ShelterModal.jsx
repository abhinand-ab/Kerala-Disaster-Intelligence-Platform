import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";

import ShelterForm from "./ShelterForm";

const MODAL_FORM_ID = "shelter-modal-form";

const ShelterModal = ({
	isOpen,
	onClose,
	onSubmit,
	initialData,
	loading,
	mode,
}) => {
	const modalRef = useRef(null);
	const firstFocusableRef = useRef(null);
	const lastFocusableRef = useRef(null);

	const title = mode === "add" ? "Add Shelter" : "Edit Shelter";
	const submitLabel = mode === "add" ? "Add Shelter" : "Save Changes";

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
			const firstFocusable = modalRef.current?.querySelector(focusableSelector);
			firstFocusable?.focus?.();
		}, 0);

		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				onClose?.();
				return;
			}

			if (event.key !== "Tab") {
				return;
			}

			const focusableElements = modalRef.current?.querySelectorAll(focusableSelector);

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
	}, [focusableSelector, isOpen, onClose]);

	if (!isOpen) {
		return null;
	}

	const handleBackdropClick = () => {
		if (loading) {
			return;
		}

		onClose?.();
	};

	const handleMouseDown = (event) => {
		if (event.target === event.currentTarget) {
			handleBackdropClick();
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6"
			aria-hidden="false"
		>
			<div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px]" onMouseDown={handleMouseDown} />

			<div
				ref={modalRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="shelter-modal-title"
				className="relative z-10 w-full max-w-3xl animate-[fadeIn_180ms_ease-out] rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)],0,0,0.6)]"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
					<div>
						<h2 id="shelter-modal-title" className="text-2xl font-semibold tracking-tight text-slate-900">
							{title}
						</h2>
						<p className="mt-1 text-sm text-slate-500">
							Manage relief shelter information.
						</p>
					</div>

					<button
						type="button"
						onClick={onClose}
						disabled={loading}
						className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
						aria-label="Close modal"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="max-h-[70vh] overflow-y-auto px-6 py-6 sm:px-8">
					<ShelterForm
						initialData={initialData}
						onSubmit={onSubmit}
						loading={loading}
						mode={mode}
						formId={MODAL_FORM_ID}
						firstFocusableRef={firstFocusableRef}
						lastFocusableRef={lastFocusableRef}
					/>
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
						type="submit"
						form={MODAL_FORM_ID}
						disabled={loading}
						className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
					>
						{loading ? "Saving..." : submitLabel}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ShelterModal;
