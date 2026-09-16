import { useEffect, useRef } from "react";

export function useScrollToTop<T extends HTMLElement = HTMLDivElement>() {
	const viewportRef = useRef<T>(null);

	useEffect(() => {
		if (viewportRef.current) {
			viewportRef.current.scrollTo({ top: 0, behavior: "instant" });
		}
	}, []);

	return viewportRef;
}

export default useScrollToTop;
