import { Icon } from "@bug-on/m3-expressive/core";
import {
	LoadingIndicator,
	ProgressIndicator,
} from "@bug-on/m3-expressive/feedback";
import { Select, TextField } from "@bug-on/m3-expressive/forms";
import { Card } from "@bug-on/m3-expressive/layout";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
	earnedScore?: number;
	totalMaxScore?: number;
}

const IdentitySectionComponent = ({
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
	earnedScore = 0,
	totalMaxScore = 0,
}: IdentitySectionProps) => {
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

	// Combobox search state
	const [inputValue, setInputValue] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const [dropdownCoords, setDropdownCoords] = useState<{
		top: number;
		left: number;
		width: number;
	} | null>(null);

	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Synchronize input value when studentId or selectedStudent changes
	useEffect(() => {
		if (selectedStudent) {
			setInputValue(selectedStudent.fullName);
		} else if (!studentId) {
			setInputValue("");
		}
	}, [selectedStudent, studentId]);

	// Filter student options based on user typing
	const filteredList = useMemo(() => {
		if (!allStudents.length) return [];
		// If input matches the currently selected student name, show all options
		if (selectedStudent && inputValue === selectedStudent.fullName) {
			return allStudents;
		}
		const query = normalizeText(inputValue);
		if (!query) return allStudents;

		const tokens = query.split(/\s+/).filter(Boolean);
		return allStudents.filter((s) => {
			const normName = normalizeText(s.fullName);
			return tokens.every((token) => normName.includes(token));
		});
	}, [allStudents, inputValue, selectedStudent]);

	// Position calculation for portal floating dropdown
	useEffect(() => {
		if (!isOpen) return;

		const updatePosition = () => {
			if (!containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			if (rect.bottom < 0 || rect.top > window.innerHeight) {
				setIsOpen(false);
				return;
			}
			setDropdownCoords({
				top: rect.bottom + 4,
				left: rect.left,
				width: Math.max(rect.width, 280),
			});
		};

		updatePosition();
		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);
		return () => {
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
		};
	}, [isOpen]);

	// Click outside dismissal
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;
			if (
				containerRef.current &&
				!containerRef.current.contains(target) &&
				dropdownRef.current &&
				!dropdownRef.current.contains(target)
			) {
				setIsOpen(false);
				if (selectedStudent) {
					setInputValue(selectedStudent.fullName);
				} else {
					setInputValue("");
				}
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, selectedStudent]);

	// Scroll active item into view during keyboard navigation
	useEffect(() => {
		if (!isOpen || !dropdownRef.current) return;
		const activeEl = dropdownRef.current.children[activeIndex] as
			| HTMLElement
			| undefined;
		if (activeEl?.scrollIntoView) {
			activeEl.scrollIntoView({ block: "nearest" });
		}
	}, [activeIndex, isOpen]);

	const handleClassChange = (newClassId: string) => {
		onClassChange(newClassId);
		onStudentChange("");
		setInputValue("");
		setIsOpen(false);
	};

	const handleSelectStudent = (student: PublicPortalStudent) => {
		onStudentChange(student.id);
		setInputValue(student.fullName);
		setIsOpen(false);
	};

	const handleClearStudent = () => {
		onStudentChange("");
		setInputValue("");
		setActiveIndex(0);
		if (classId && !loadingStudents && allStudents.length > 0) {
			setIsOpen(true);
		}
	};

	const handleInputChange = (val: string) => {
		setInputValue(val);
		if (!isOpen) setIsOpen(true);
		setActiveIndex(0);
		onStudentSearchChange?.(val);
	};

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (!isOpen) {
			if (e.key === "ArrowDown" || e.key === "Enter") {
				e.preventDefault();
				setIsOpen(true);
			}
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((prev) =>
				filteredList.length > 0 ? (prev + 1) % filteredList.length : 0,
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((prev) =>
				filteredList.length > 0
					? (prev - 1 + filteredList.length) % filteredList.length
					: 0,
			);
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (
				filteredList.length > 0 &&
				activeIndex >= 0 &&
				activeIndex < filteredList.length
			) {
				handleSelectStudent(filteredList[activeIndex]);
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			setIsOpen(false);
			if (selectedStudent) {
				setInputValue(selectedStudent.fullName);
			} else {
				setInputValue("");
			}
		}
	};

	const completionPercent =
		totalAssignmentsCount > 0
			? Math.round((completedCount / totalAssignmentsCount) * 100)
			: 0;

	return (
		<Card
			variant="filled"
			className="flex flex-col gap-3 bg-m3-surface-container-lowest p-3.5 sm:p-4 text-m3-on-surface rounded-m3-xl border border-m3-outline-variant/40 shadow-xs"
		>
			<div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3.5">
				{/* Left: 2 distinct dropdowns: Class & Student */}
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
					{/* Dropdown 1: Chọn lớp */}
					<div className="w-full sm:w-48 md:w-56 shrink-0">
						<Select
							variant="filled"
							colorVariant="vibrant"
							label="Lớp học"
							placeholder="Chọn lớp"
							options={classOptions}
							value={classId}
							onChange={handleClassChange}
							disabled={classes.length === 0}
							className="w-full"
						/>
					</div>

					{/* Dropdown 2: Gõ tên để tìm học sinh (Searchable Combobox with Portal) */}
					<div
						ref={containerRef}
						className="relative w-full sm:w-72 md:w-80 shrink-0"
					>
						<TextField
							variant="filled"
							label="Học sinh"
							placeholder={
								loadingStudents
									? "Đang tải danh sách..."
									: !classId
										? "Chọn lớp trước"
										: allStudents.length === 0
											? "Chưa có học sinh"
											: "Gõ tên để tìm học sinh..."
							}
							value={inputValue}
							onChange={handleInputChange}
							onFocus={(e) => {
								if (classId && !loadingStudents && allStudents.length > 0) {
									setIsOpen(true);
									e.currentTarget.select();
								}
							}}
							onKeyDown={handleKeyDown}
							disabled={!classId || loadingStudents || allStudents.length === 0}
							trailingIconMode="custom"
							trailingIcon={
								<div className="flex items-center gap-0.5">
									{studentId || inputValue ? (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												handleClearStudent();
											}}
											title="Xóa lựa chọn"
											aria-label="Xóa lựa chọn"
											className="flex h-7 w-7 items-center justify-center rounded-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-highest transition-colors cursor-pointer"
										>
											<Icon name="close" size={16} />
										</button>
									) : null}
									<button
										type="button"
										tabIndex={-1}
										disabled={
											!classId || loadingStudents || allStudents.length === 0
										}
										onClick={(e) => {
											e.stopPropagation();
											setIsOpen((prev) => !prev);
										}}
										className="flex h-7 w-7 items-center justify-center rounded-full text-m3-on-surface-variant hover:text-m3-on-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
									>
										<Icon
											name={isOpen ? "arrow_drop_up" : "arrow_drop_down"}
											size={22}
										/>
									</button>
								</div>
							}
							className="w-full"
						/>

						{/* Portal-backed floating options list (bypasses Card overflow: hidden) */}
						{isOpen &&
							dropdownCoords &&
							typeof document !== "undefined" &&
							createPortal(
								<div
									ref={dropdownRef}
									style={{
										position: "fixed",
										top: `${dropdownCoords.top}px`,
										left: `${dropdownCoords.left}px`,
										width: `${dropdownCoords.width}px`,
										zIndex: 99999,
									}}
									className="max-h-72 overflow-y-auto rounded-2xl bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant/60 shadow-2xl p-1.5 focus:outline-hidden"
									role="listbox"
									aria-label="Danh sách học sinh"
								>
									{filteredList.length === 0 ? (
										<div className="px-3.5 py-4 text-center text-xs text-m3-on-surface-variant flex flex-col items-center gap-1.5">
											<Icon
												name="search_off"
												size={20}
												className="text-m3-outline"
											/>
											<span>
												Không tìm thấy học sinh nào phù hợp với &quot;
												{inputValue}&quot;
											</span>
										</div>
									) : (
										filteredList.map((student, idx) => {
											const isSelected = student.id === studentId;
											const isActive = idx === activeIndex;
											return (
												<div
													key={student.id}
													role="option"
													tabIndex={-1}
													aria-selected={isSelected}
													onClick={() => handleSelectStudent(student)}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															e.preventDefault();
															handleSelectStudent(student);
														}
													}}
													onMouseEnter={() => setActiveIndex(idx)}
													className={cn(
														"flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer select-none",
														isSelected
															? "bg-m3-primary/15 text-m3-primary font-bold"
															: isActive
																? "bg-m3-surface-container-highest text-m3-on-surface"
																: "text-m3-on-surface hover:bg-m3-surface-container-highest/60",
													)}
												>
													<div className="flex items-center gap-2.5 min-w-0">
														<Icon
															name={isSelected ? "check_circle" : "person"}
															size={18}
															className={
																isSelected
																	? "text-m3-primary shrink-0"
																	: "text-m3-on-surface-variant shrink-0"
															}
														/>
														<span className="truncate">{student.fullName}</span>
													</div>
													{isSelected && (
														<span className="text-[11px] font-semibold text-m3-primary bg-m3-primary/10 px-2 py-0.5 rounded-full shrink-0">
															Đang chọn
														</span>
													)}
												</div>
											);
										})
									)}
								</div>,
								document.body,
							)}
					</div>
				</div>

				{/* Right: Gamified Progress & Score Metrics (when student selected) or Prompt */}
				{selectedStudent ? (
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 lg:gap-5 shrink-0">
						{/* Progress Bar Widget */}
						<div className="flex flex-col gap-1 sm:min-w-44">
							<div className="flex items-center justify-between text-xs">
								<span className="font-semibold text-m3-on-surface-variant flex items-center gap-1">
									<Icon
										name="task_alt"
										size={14}
										className="text-emerald-600 dark:text-emerald-400"
									/>
									Tiến độ
								</span>
								<span className="font-bold text-m3-on-surface">
									{completedCount}/{totalAssignmentsCount} ({completionPercent}
									%)
								</span>
							</div>
							<div className="w-full">
								<ProgressIndicator
									variant="linear"
									trackShape="flat"
									trackHeight={6}
									showStopIndicator={false}
									aria-label={`Tiến độ làm bài: ${completionPercent}%`}
									value={completionPercent}
								/>
							</div>
						</div>

						{/* Total Score Badge */}
						{totalMaxScore > 0 && (
							<div className="flex items-center gap-2.5 rounded-2xl bg-m3-primary-container/60 px-3.5 py-1.5 text-m3-on-primary-container border border-m3-primary/20 shrink-0">
								<Icon
									name="emoji_events"
									size={22}
									className="text-m3-primary shrink-0"
								/>
								<div>
									<div className="text-[10px] font-semibold text-m3-on-primary-container/80 uppercase tracking-wider">
										Tổng điểm
									</div>
									<div className="text-sm font-black text-m3-on-primary-container leading-tight">
										{earnedScore}{" "}
										<span className="text-xs font-medium text-m3-on-primary-container/70">
											/ {totalMaxScore} đ
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant bg-m3-surface-container-high/60 px-3 py-2 rounded-xl border border-m3-outline-variant/20 shrink-0">
						<Icon name="info" size={16} className="text-m3-primary shrink-0" />
						<span>Chọn tên học sinh để bắt đầu nộp bài</span>
					</div>
				)}
			</div>

			{classId && loadingStudents && (
				<div className="flex items-center gap-2 text-xs font-medium text-m3-on-surface-variant pt-1 border-t border-m3-outline-variant/20">
					<LoadingIndicator aria-label="Đang tải học sinh" size={16} />
					<span>
						Đang tải danh sách học sinh của lớp{" "}
						{selectedClass?.name || "đã chọn"}...
					</span>
				</div>
			)}

			{classId && !loadingStudents && allStudents.length === 0 && (
				<div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 pt-1 border-t border-m3-outline-variant/20">
					<Icon name="warning" size={16} />
					<span>Lớp học này hiện chưa có học sinh nào.</span>
				</div>
			)}
		</Card>
	);
};

export const IdentitySection = memo(IdentitySectionComponent);
