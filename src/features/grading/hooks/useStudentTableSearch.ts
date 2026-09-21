import { type RefObject, useState } from "react";
import type { Student } from "../../../types/student.types";
import { normalizeVietnameseText } from "../utils/gradingUtils";

interface UseStudentTableSearchProps {
	gradingStudents: Student[];
	rowRefs: RefObject<Map<string, HTMLTableRowElement>>;
}

const FLOATING_TOOLBAR_OFFSET = 88;

export const useStudentTableSearch = ({
	gradingStudents,
	rowRefs,
}: UseStudentTableSearchProps) => {
	const [studentSearchQuery, setStudentSearchQuery] = useState("");
	const [studentSearchHint, setStudentSearchHint] = useState("");
	const [studentSearchMatchedIds, setStudentSearchMatchedIds] = useState<
		string[]
	>([]);
	const [studentSearchMatchIndex, setStudentSearchMatchIndex] = useState(0);
	const [highlightedStudentId, setHighlightedStudentId] = useState<
		string | null
	>(null);
	const [lastStudentSearchKeyword, setLastStudentSearchKeyword] = useState("");

	const scrollRowIntoStudentTable = (row: HTMLTableRowElement) => {
		let scrollContainer = row.closest(
			'[data-student-scroll-container="true"]',
		) as HTMLElement | null;

		// Fallback: Nếu container được đánh dấu không cuộn được (scrollHeight <= clientHeight),
		// tìm container cha gần nhất có overflow scroll/auto
		if (
			!scrollContainer ||
			scrollContainer.scrollHeight <= scrollContainer.clientHeight
		) {
			let parent = row.parentElement;
			while (parent && parent !== document.body) {
				const style = window.getComputedStyle(parent);
				const overflowY = style.overflowY;
				if (
					(overflowY === "auto" || overflowY === "scroll") &&
					parent.scrollHeight > parent.clientHeight
				) {
					scrollContainer = parent;
					break;
				}
				parent = parent.parentElement;
			}
		}

		if (!scrollContainer) {
			row.scrollIntoView({ behavior: "smooth", block: "center" });
			return;
		}

		const stickyHeader = scrollContainer.querySelector(
			"thead.sticky, thead",
		) as HTMLElement | null;
		const stickyHeaderHeight =
			stickyHeader?.getBoundingClientRect().height ?? 0;
		const padding = 12;

		const currentScrollTop = scrollContainer.scrollTop;
		const containerRect = scrollContainer.getBoundingClientRect();
		const rowRect = row.getBoundingClientRect();
		const rowTop = rowRect.top - containerRect.top + currentScrollTop;
		const rowBottom = rowTop + rowRect.height;

		const visibleTop = currentScrollTop + stickyHeaderHeight + padding;
		const visibleBottom =
			currentScrollTop +
			scrollContainer.clientHeight -
			padding -
			FLOATING_TOOLBAR_OFFSET;

		let nextScrollTop = currentScrollTop;
		if (rowTop < visibleTop) {
			nextScrollTop = rowTop - stickyHeaderHeight - padding;
		} else if (rowBottom > visibleBottom) {
			nextScrollTop =
				rowBottom -
				scrollContainer.clientHeight +
				padding +
				FLOATING_TOOLBAR_OFFSET;
		}

		scrollContainer.scrollTo({
			top: Math.max(0, nextScrollTop),
			behavior: "smooth",
		});

		// Đảm bảo hàng không bị khuất ngoài viewport trình duyệt (do floating toolbar hoặc topbar)
		const targetRowViewportTop = containerRect.top + (rowTop - nextScrollTop);
		const targetRowViewportBottom = targetRowViewportTop + rowRect.height;
		const viewportBottomLimit = window.innerHeight - FLOATING_TOOLBAR_OFFSET;

		if (targetRowViewportBottom > viewportBottomLimit) {
			window.scrollBy({
				top: targetRowViewportBottom - viewportBottomLimit + padding,
				behavior: "smooth",
			});
		} else if (targetRowViewportTop < 72) {
			window.scrollBy({
				top: targetRowViewportTop - 72,
				behavior: "smooth",
			});
		}
	};

	const focusMatchedStudent = (matchedIds: string[], index: number) => {
		if (matchedIds.length === 0 || index < 0 || index >= matchedIds.length)
			return;
		const studentId = matchedIds[index];
		const student = gradingStudents.find((item) => item.id === studentId);
		const row = rowRefs.current?.get(studentId);
		setHighlightedStudentId(studentId);

		if (row) {
			scrollRowIntoStudentTable(row);
		}

		if (student) {
			setStudentSearchHint(
				`Đã cuộn tới kết quả ${index + 1}/${matchedIds.length}: ${student.middleName} ${student.firstName}`,
			);
		}
	};

	const buildMatchedStudentIds = (keyword: string): string[] =>
		gradingStudents
			.filter((student) => {
				const fullName = normalizeVietnameseText(
					`${student.middleName} ${student.firstName}`,
				);
				return fullName.includes(keyword);
			})
			.map((student) => student.id);

	const scrollToStudentByKeyword = () => {
		const keyword = normalizeVietnameseText(studentSearchQuery);
		if (!keyword) {
			setStudentSearchHint("Vui lòng nhập tên học sinh cần tìm.");
			setStudentSearchMatchedIds([]);
			setStudentSearchMatchIndex(-1);
			setHighlightedStudentId(null);
			setLastStudentSearchKeyword("");
			return;
		}

		const isSameKeyword =
			keyword === lastStudentSearchKeyword &&
			studentSearchMatchedIds.length > 0;
		if (isSameKeyword) {
			const nextIndex =
				(studentSearchMatchIndex + 1) % studentSearchMatchedIds.length;
			setStudentSearchMatchIndex(nextIndex);
			focusMatchedStudent(studentSearchMatchedIds, nextIndex);
			return;
		}

		const matchedIds = buildMatchedStudentIds(keyword);
		if (matchedIds.length === 0) {
			setStudentSearchHint(
				`Không tìm thấy học sinh phù hợp với từ khóa "${studentSearchQuery}".`,
			);
			setStudentSearchMatchedIds([]);
			setStudentSearchMatchIndex(-1);
			setHighlightedStudentId(null);
			setLastStudentSearchKeyword(keyword);
			return;
		}

		setStudentSearchMatchedIds(matchedIds);
		setStudentSearchMatchIndex(0);
		setLastStudentSearchKeyword(keyword);
		focusMatchedStudent(matchedIds, 0);
	};

	const moveToMatchedStudent = (direction: -1 | 1) => {
		if (studentSearchMatchedIds.length === 0) {
			scrollToStudentByKeyword();
			return;
		}

		const length = studentSearchMatchedIds.length;
		const current = studentSearchMatchIndex >= 0 ? studentSearchMatchIndex : 0;
		const nextIndex = (current + direction + length) % length;
		setStudentSearchMatchIndex(nextIndex);
		focusMatchedStudent(studentSearchMatchedIds, nextIndex);
	};

	const resetSearchState = () => {
		setStudentSearchQuery("");
		setStudentSearchHint("");
		setStudentSearchMatchedIds([]);
		setStudentSearchMatchIndex(-1);
		setHighlightedStudentId(null);
		setLastStudentSearchKeyword("");
	};

	return {
		studentSearchQuery,
		setStudentSearchQuery,
		studentSearchHint,
		studentSearchMatchedIds,
		studentSearchMatchIndex,
		highlightedStudentId,
		scrollToStudentByKeyword,
		moveToMatchedStudent,
		resetSearchState,
	};
};
