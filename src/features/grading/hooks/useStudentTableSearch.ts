import { type RefObject, useState } from "react";
import type { Student } from "../../../types/student.types";
import { normalizeVietnameseText } from "../utils/gradingUtils";

interface UseStudentTableSearchProps {
	gradingStudents: Student[];
	rowRefs: RefObject<Map<string, HTMLTableRowElement>>;
}

export const useStudentTableSearch = ({
	gradingStudents,
	rowRefs,
}: UseStudentTableSearchProps) => {
	const [studentSearchQuery, setStudentSearchQuery] = useState("");
	const [studentSearchHint, setStudentSearchHint] = useState("");
	const [studentSearchMatchedIds, setStudentSearchMatchedIds] = useState<
		string[]
	>([]);
	const [studentSearchMatchIndex, setStudentSearchMatchIndex] = useState(-1);
	const [lastStudentSearchKeyword, setLastStudentSearchKeyword] = useState("");

	const scrollRowIntoStudentTable = (row: HTMLTableRowElement) => {
		const scrollContainer = row.closest(
			'[data-student-scroll-container="true"]',
		) as HTMLElement | null;
		if (!scrollContainer) {
			row.scrollIntoView({ behavior: "smooth", block: "center" });
			return;
		}

		const stickyHeader = scrollContainer.querySelector(
			"thead.sticky",
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
			currentScrollTop + scrollContainer.clientHeight - padding;

		let nextScrollTop = currentScrollTop;
		if (rowTop < visibleTop) {
			nextScrollTop = rowTop - stickyHeaderHeight - padding;
		} else if (rowBottom > visibleBottom) {
			nextScrollTop = rowBottom - scrollContainer.clientHeight + padding;
		}

		scrollContainer.scrollTo({
			top: Math.max(0, nextScrollTop),
			behavior: "smooth",
		});
	};

	const focusMatchedStudent = (matchedIds: string[], index: number) => {
		if (matchedIds.length === 0 || index < 0 || index >= matchedIds.length)
			return;
		const studentId = matchedIds[index];
		const student = gradingStudents.find((item) => item.id === studentId);
		const row = rowRefs.current?.get(studentId);
		if (row) {
			scrollRowIntoStudentTable(row);
			row.classList.add("ring-2", "ring-blue-300");
			window.setTimeout(
				() => row.classList.remove("ring-2", "ring-blue-300"),
				1200,
			);
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
				const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				const keywordPattern = new RegExp(
					`(^|\\s)${escapedKeyword}(\\s|$)`,
					"i",
				);
				return keywordPattern.test(fullName);
			})
			.map((student) => student.id);

	const scrollToStudentByKeyword = () => {
		const keyword = normalizeVietnameseText(studentSearchQuery);
		if (!keyword) {
			setStudentSearchHint("Vui lòng nhập tên học sinh cần tìm.");
			setStudentSearchMatchedIds([]);
			setStudentSearchMatchIndex(-1);
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
		setLastStudentSearchKeyword("");
	};

	return {
		studentSearchQuery,
		setStudentSearchQuery,
		studentSearchHint,
		studentSearchMatchedIds,
		studentSearchMatchIndex,
		scrollToStudentByKeyword,
		moveToMatchedStudent,
		resetSearchState,
	};
};
