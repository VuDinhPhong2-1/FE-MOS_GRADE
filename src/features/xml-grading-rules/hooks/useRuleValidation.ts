import { useCallback, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { xmlGradingRulesService } from "../../../services/xml-grading-rules.service";
import type {
	GradingRuleSet,
	XmlRuleValidationResult,
} from "../../../types/xml-grading-rules.types";
import { notify } from "../../../utils/notify";
import { prepareRuleSet } from "../utils/xml-rule-helpers";

export const useRuleValidation = () => {
	const { getAccessToken } = useAuth();
	const [validation, setValidation] = useState<XmlRuleValidationResult | null>(
		null,
	);
	const [isValidating, setIsValidating] = useState(false);

	const validateRuleSet = useCallback(
		async (ruleSet: GradingRuleSet) => {
			setIsValidating(true);
			try {
				const result = await xmlGradingRulesService.validate(
					prepareRuleSet(ruleSet),
					getAccessToken,
				);
				setValidation(result);
				if (result.isValid) {
					notify.success("Ruleset hợp lệ.");
				} else {
					notify.warning(
						`Phát hiện ${result.errors?.length || 0} lỗi trong ruleset.`,
					);
				}
				return result;
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Validate thất bại.";
				const failedResult: XmlRuleValidationResult = {
					isValid: false,
					errors: [message],
					warnings: [],
				};
				setValidation(failedResult);
				notify.error(message);
				return failedResult;
			} finally {
				setIsValidating(false);
			}
		},
		[getAccessToken],
	);

	const clearValidation = useCallback(() => {
		setValidation(null);
	}, []);

	return {
		validation,
		setValidation,
		isValidating,
		validateRuleSet,
		clearValidation,
	};
};
