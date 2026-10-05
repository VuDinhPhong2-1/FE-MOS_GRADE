import { Button } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import { LoadingIndicator } from "@bug-on/m3-expressive/feedback";
import {
	Select,
	TextField,
	type TextFieldHandle,
} from "@bug-on/m3-expressive/forms";
import { Card, Text } from "@bug-on/m3-expressive/layout";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
	PublicPortalClass,
	PublicPortalStudent,
} from "../../../types/submission-portal.types";
import { cn } from "../../../utils/utils";
import { normalizeText } from "../utils/grading";

export interface IdentitySectionProps {
	classes: PublicPortalClass[];
	classId: string;
	onClassChange: (classId: string) => void;
	onStudentSearchChange?: (search: string) => void;
	filteredStudents?: PublicPortalStudent[];
	students?: PublicPortalStudent[];
	studentId: string;
	onStudentChange: (studentId: string) => void;
	loadingStudents: boolean;
	selectedClass?: PublicPortalClass;
	selectedStudent?: PublicPortalStudent;
	completedCount: number;
	totalAssignmentsCount: number;
}

const matchesStudent = (studentName: string, query: string): boolean => {
	const normalizedName = normalizeText(studentName);
	const queryTokens = normalizeText(query).split(/\s+/).filter(Boolean);
	if (queryTokens.length === 0) return true;
	return queryTokens.every((token) => normalizedName.includes(token));
};

export const IdentitySection = ({
	classes,
	classId,
	onClassChange,
	onStudentSearchChange,
	filteredStudents = [],
	students,
	studentId,
	onStudentChange,
	loadingStudents,
	selectedClass,
	selectedStudent,
	completedCount,
	totalAssignmentsCount,
}: IdentitySectionProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState(-1);

	const containerRef = useRef<HTMLDivElement>(null);
	const listboxRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<TextFieldHandle>(null);

	const allStudents = useMemo(() => {
		if (students && students.length > 0) return students;
		return filteredStudents;
	}, [students, filteredStudents]);

	const classOptions = useMemo(
		() =>
			classes.map((c) => ({
				label: c.name,
				value: c.id,
			})),
		[classes],
	);

	// Sync input text when selectedStudent or studentId changes externally
	useEffect(() => {
		if (selectedStudent) {
			setInputValue(selectedStudent.fullName);
		} else {
			setInputValue("");
		}
		setSearchQuery("");
		setHighlightedIndex(-1);
	}, [studentId, selectedStudent]);

	// Reset state when class changes
	useEffect(() => {
		setIsOpen(false);
		setSearchQuery("");
		setHighlightedIndex(-1);
	}, [classId]);

	// Filter student list based on search query
	const matchingStudents = useMemo(() => {
		if (!searchQuery.trim()) {
			return allStudents;
		}
		return allStudents.filter((s) => matchesStudent(s.fullName, searchQuery));
	}, [allStudents, searchQuery]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setHighlightedIndex(-1);
				setSearchQuery("");
				setInputValue(selectedStudent?.fullName || "");
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [selectedStudent]);

	const scrollItemIntoView = (index: number) => {
		const list = listboxRef.current;
		if (!list) return;
		const item = list.children[index] as HTMLElement | undefined;
		if (item) {
			item.scrollIntoView({ block: "nearest" });
		}
	};

	const handleSelectStudent = (student: PublicPortalStudent) => {
		onStudentChange(student.id);
		setInputValue(student.fullName);
		setSearchQuery("");
		setIsOpen(false);
		setHighlightedIndex(-1);
		onStudentSearchChange?.("");
	};

	const handleClearStudent = () => {
		onStudentChange("");
		setInputValue("");
		setSearchQuery("");
		setHighlightedIndex(-1);
		onStudentSearchChange?.("");
		setIsOpen(true);
		inputRef.current?.focus();
	};

	const handleInputChange = (newVal: string) => {
		setInputValue(newVal);
		setSearchQuery(newVal);
		setIsOpen(true);
		setHighlightedIndex(0);
		onStudentSearchChange?.(newVal);
	};

	const handleInputFocus = () => {
		if (classId && !loadingStudents) {
			setIsOpen(true);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!isOpen) {
			if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				setIsOpen(true);
				setHighlightedIndex(0);
			}
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (matchingStudents.length > 0) {
				setHighlightedIndex((prev) => {
					const next = prev < matchingStudents.length - 1 ? prev + 1 : 0;
					scrollItemIntoView(next);
					return next;
				});
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (matchingStudents.length > 0) {
				setHighlightedIndex((prev) => {
					const next = prev > 0 ? prev - 1 : matchingStudents.length - 1;
					scrollItemIntoView(next);
					return next;
				});
			}
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (
				highlightedIndex >= 0 &&
				highlightedIndex < matchingStudents.length
			) {
				handleSelectStudent(matchingStudents[highlightedIndex]);
			} else if (matchingStudents.length === 1) {
				handleSelectStudent(matchingStudents[0]);
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			setIsOpen(false);
			setHighlightedIndex(-1);
			setSearchQuery("");
			setInputValue(selectedStudent?.fullName || "");
		} else if (e.key === "Tab") {
			setIsOpen(false);
			setHighlightedIndex(-1);
		}
	};

	const isPickerDisabled = !classId || loadingStudents;

	const pickerPlaceholder = loadingStudents
		? "Đang tải danh sách..."
		: !classId
			? "Vui lòng chọn lớp trước"
			: "Tìm hoặc chọn tên của bạn";

	return (
		<Card
			variant="filled"
			className="flex flex-col gap-4 bg-m3-surface-container-lowest p-5 text-m3-on-surface rounded-m3-xl"
		>
			<div className="flex flex-wrap items-center gap-2">
				<span
					className={cn(
						"inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold h-10",
						classId
							? "bg-m3-primary-container text-m3-on-primary-container"
							: "bg-m3-surface-container-high text-m3-on-surface-variant",
					)}
				>
					<Icon
						name={classId ? "check_circle" : "looks_one"}
						size={16}
						animateFill
						fill={classId ? 1 : 0}
					/>
					1. Chọn lớp
				</span>
				<span
					className={cn(
						"inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold h-10",
						studentId
							? "bg-m3-primary-container text-m3-on-primary-container"
							: "bg-m3-surface-container-high text-m3-on-surface-variant",
					)}
				>
					<Icon
						name={studentId ? "check_circle" : "looks_two"}
						size={16}
						animateFill
						fill={studentId ? 1 : 0}
					/>
					2. Xác nhận học sinh
				</span>
				<span
					className={cn(
						"inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold h-10",
						completedCount === totalAssignmentsCount
							? "bg-m3-primary-container text-m3-on-primary-container"
							: "bg-m3-surface-container-high text-m3-on-surface-variant",
					)}
				>
					<Icon
						name={
							completedCount === totalAssignmentsCount
								? "check_circle"
								: "assignment_turned_in"
						}
						size={16}
						animateFill
						fill={completedCount === totalAssignmentsCount ? 1 : 0}
					/>
					3. Nộp bài ({completedCount}/{totalAssignmentsCount})
				</span>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Select
					variant="filled"
					colorVariant="vibrant"
					label="Lớp học"
					placeholder="Chọn lớp"
					options={classOptions}
					value={classId}
					onChange={(value) => onClassChange(value)}
				/>

				{/* Accessible & robust student combobox */}
				<div ref={containerRef} className="relative w-full">
					<TextField
						ref={inputRef}
						variant="filled"
						label="Tên của bạn"
						placeholder={pickerPlaceholder}
						value={inputValue}
						onChange={(val) => handleInputChange(val)}
						onFocus={handleInputFocus}
						onKeyDown={handleKeyDown}
						disabled={isPickerDisabled}
						leadingIcon={<Icon name="search" size={20} />}
						trailingIcon={
							(studentId || inputValue) && !isPickerDisabled ? (
								<button
									type="button"
									aria-label="Xóa chọn học sinh"
									tabIndex={-1}
									className="flex items-center justify-center p-0.5 rounded-full hover:bg-m3-surface-container-highest cursor-pointer text-m3-on-surface-variant transition-colors"
									onMouseDown={(e) => {
										e.preventDefault();
										handleClearStudent();
									}}
								>
									<Icon name="close" size={18} />
								</button>
							) : (
								<button
									type="button"
									aria-label={isOpen ? "Đóng danh sách" : "Mở danh sách"}
									tabIndex={-1}
									disabled={isPickerDisabled}
									className={cn(
										"flex items-center justify-center p-0.5 rounded-full hover:bg-m3-surface-container-highest cursor-pointer text-m3-on-surface-variant transition-transform duration-200",
										isOpen && "rotate-180",
									)}
									onMouseDown={(e) => {
										e.preventDefault();
										if (!isPickerDisabled) {
											setIsOpen((prev) => !prev);
											if (!isOpen) {
												inputRef.current?.focus();
											}
										}
									}}
								>
									<Icon name="arrow_drop_down" size={22} />
								</button>
							)
						}
					/>

					{/* Dropdown list */}
					{isOpen && !isPickerDisabled && (
						<div
							ref={listboxRef}
							role="listbox"
							id="student-combobox-listbox"
							aria-label="Danh sách học sinh"
							className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-m3-outline-variant/30 bg-m3-surface-container-high p-1 shadow-lg backdrop-blur-sm"
						>
							{matchingStudents.length === 0 ? (
								<div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center text-m3-on-surface-variant">
									<Icon name="search_off" size={24} className="opacity-60" />
									<Text variant="body-sm" className="text-m3-on-surface-variant">
										Không tìm thấy học sinh phù hợp
									</Text>
								</div>
							) : (
								matchingStudents.map((s, idx) => {
									const isSelected = s.id === studentId;
									const isHighlighted = idx === highlightedIndex;

									return (
										<div
											key={s.id}
											role="option"
											id={`student-option-${s.id}`}
											aria-selected={isSelected}
											onMouseDown={(e) => {
												e.preventDefault();
												handleSelectStudent(s);
											}}
											onMouseEnter={() => setHighlightedIndex(idx)}
											className={cn(
												"flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors select-none",
												isSelected
													? "bg-m3-primary-container text-m3-on-primary-container font-semibold"
													: isHighlighted
														? "bg-m3-surface-container-highest text-m3-on-surface"
														: "text-m3-on-surface hover:bg-m3-surface-container-highest",
											)}
										>
											<div className="flex items-center gap-2.5 min-w-0">
												<Icon
													name={isSelected ? "account_circle" : "person"}
													size={20}
													className={cn(
														"shrink-0",
														isSelected
															? "text-m3-on-primary-container"
															: "text-m3-on-surface-variant",
													)}
												/>
												<span className="truncate">{s.fullName}</span>
											</div>
											{isSelected && (
												<Icon
													name="check"
													size={18}
													className="shrink-0 text-m3-on-primary-container"
												/>
											)}
										</div>
									);
								})
							)}
						</div>
					)}
				</div>
			</div>

			{classId && loadingStudents && (
				<Card
					variant="filled"
					className="flex items-center gap-2 bg-m3-secondary-container p-3 text-m3-on-secondary-container"
				>
					<LoadingIndicator aria-label="Đang tải học sinh" size={20} />
					<Text variant="body-sm" className="font-semibold">
						Đang tải danh sách học sinh của lớp{" "}
						{selectedClass?.name || "đã chọn"}...
					</Text>
				</Card>
			)}

			{classId && !loadingStudents && allStudents.length === 0 && (
				<Card
					variant="filled"
					className="flex items-center gap-2 bg-m3-tertiary-container p-3 text-m3-on-tertiary-container"
				>
					<Icon name="info" size={20} />
					<Text variant="body-sm">
						Lớp học này hiện chưa có học sinh nào.
					</Text>
				</Card>
			)}

			{selectedStudent && (
				<Card
					variant="filled"
					className="flex items-center justify-between gap-2 bg-m3-tertiary-container rounded-m3-md p-4 text-m3-on-tertiary-container flex-row"
				>
					<div className="flex items-center gap-2">
						<Icon
							name="account_circle"
							size={24}
							className="text-m3-on-tertiary-container"
						/>
						<Text variant="body-lg" className="text-m3-on-tertiary-container">
							Đang nộp bài cho{" "}
							<span className="font-bold text-m3-on-tertiary-container">
								{selectedStudent.fullName}
							</span>{" "}
							— lớp{" "}
							<span className="font-bold text-m3-on-tertiary-container">
								{selectedClass?.name}
							</span>
						</Text>
					</div>
					<Button
						colorStyle="text"
						onClick={handleClearStudent}
						size="sm"
						className="text-m3-on-tertiary-container"
					>
						Đổi học sinh
					</Button>
				</Card>
			)}
		</Card>
	);
};
