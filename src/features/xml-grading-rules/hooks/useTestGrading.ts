import { useCallback, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { xmlGradingRulesService } from "../../../services/xml-grading-rules.service";
import type { GradingRuleSet } from "../../../types/xml-grading-rules.types";
import { notify } from "../../../utils/notify";

export const useTestGrading = () => {
	const { getAccessToken } = useAuth();
	const [gradeProjectCode, setGradeProjectCode] = useState("");
	const [gradeFile, setGradeFile] = useState<File | null>(null);
	const [gradeAttachmentFile, setGradeAttachmentFile] = useState<File | null>(
		null,
	);
	const [gradeJson, setGradeJson] = useState("");
	const [isTestGrading, setIsTestGrading] = useState(false);

	const gradeWithXmlRules = useCallback(
		async (ruleSet: GradingRuleSet) => {
			if (!gradeFile) {
				notify.warning("Vui lòng chọn file Office cần test chấm.");
				return;
			}
			const projectCode = gradeProjectCode || ruleSet.projects[0]?.projectCode;
			if (!projectCode) {
				notify.warning("Vui lòng nhập/chọn projectCode.");
				return;
			}
			if (!ruleSet.isActive) {
				notify.warning(
					"Ruleset hiện tại chưa bật Active. Backend chỉ dùng ruleset Active để chấm thử XML.",
				);
				return;
			}
			if (isTestGrading) return;

			setIsTestGrading(true);
			setGradeJson("");
			try {
				const result = await xmlGradingRulesService.grade(
					ruleSet.subject,
					projectCode,
					gradeFile,
					getAccessToken,
					gradeAttachmentFile,
				);
				setGradeJson(JSON.stringify(result, null, 2));
				notify.success("Test chấm XML hoàn tất.");
			} catch (error) {
				notify.error(
					error instanceof Error ? error.message : "Test chấm thất bại.",
				);
			} finally {
				setIsTestGrading(false);
			}
		},
		[
			getAccessToken,
			gradeAttachmentFile,
			gradeFile,
			gradeProjectCode,
			isTestGrading,
		],
	);

	return {
		gradeProjectCode,
		setGradeProjectCode,
		gradeFile,
		setGradeFile,
		gradeAttachmentFile,
		setGradeAttachmentFile,
		gradeJson,
		setGradeJson,
		isTestGrading,
		gradeWithXmlRules,
	};
};
