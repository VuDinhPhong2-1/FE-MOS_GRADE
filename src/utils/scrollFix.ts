/**
 * Fixes mouse wheel and touch scrolling for Radix DropdownMenu / Select / Popover portals
 * when nested inside modal Dialogs.
 *
 * Root Cause:
 * Radix Dialog uses `react-remove-scroll`, which attaches a non-passive 'wheel' and
 * 'touchmove' listener to `document`. When a dropdown menu is portaled to `document.body`,
 * `react-remove-scroll` considers it outside the dialog container and calls
 * `event.preventDefault()`, cancelling all native scrolling inside the dropdown.
 *
 * Solution:
 * Intercept 'wheel' and 'touchmove' events in the capture phase on `window`. If the
 * event target is inside a menu/popover/dropdown or scroll-area viewport, stop
 * propagation so `react-remove-scroll` never cancels the event, allowing native browser
 * scrolling to execute.
 */
export const installOverlayScrollFix = (): void => {
	const shouldAllowScroll = (target: EventTarget | null): boolean => {
		if (!(target instanceof Element)) return false;
		return Boolean(
			target.closest('[role="menu"]') ||
				target.closest("[data-radix-scroll-area-viewport]") ||
				target.closest("[data-radix-menu-content]") ||
				target.closest("[data-radix-popper-content-wrapper]") ||
				target.closest("[data-radix-select-viewport]"),
		);
	};

	const handleScrollGesture = (e: WheelEvent | TouchEvent) => {
		if (shouldAllowScroll(e.target)) {
			e.stopPropagation();
		}
	};

	window.addEventListener("wheel", handleScrollGesture, {
		capture: true,
		passive: false,
	});
	window.addEventListener("touchmove", handleScrollGesture, {
		capture: true,
		passive: false,
	});
};
