import type React from "react";
import type { Student } from "../../types/student.types";
import { GradingWorkspace } from "./GradingWorkspace";
import type { GradingMode } from "./types/gradingFeature.types";

export interface GradingModalProps {
	isOpen: boolean;
	onClose: () => void;
	classId: string;
	students: Student[];
	onSuccess?: () => void | Promise<void>;
	displayMode?: "modal" | "page";
	title?: string;
	initialMode?: GradingMode;
}

/**
 * GradingModal - Lớp bọc tương thích ngược (Backward-compatible wrapper).
 * Mặc định ủy quyền toàn bộ chức năng sang GradingWorkspace (Page Architecture).
 */
export const GradingModal: React.FC<GradingModalProps> = ({
	isOpen,
	onClose,
	classId,
	students,
	onSuccess,
	displayMode = "modal",
	title = "Chấm điểm",
	initialMode = null,
}) => {
	if (!isOpen) return null;

	const isPageMode = displayMode === "page";

	if (isPageMode) {
		return (
			<div className="w-full">
				<GradingWorkspace
					classId={classId}
					students={students}
					onClose={onClose}
					onSuccess={onSuccess}
					title={title}
					initialMode={initialMode}
				/>
			</div>
		);
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
		>
			<div className="w-full max-w-6xl my-auto">
				<GradingWorkspace
					classId={classId}
					students={students}
					onClose={onClose}
					onSuccess={onSuccess}
					title={title}
					initialMode={initialMode}
				/>
			</div>
		</div>
	);
};

export default GradingModal;
