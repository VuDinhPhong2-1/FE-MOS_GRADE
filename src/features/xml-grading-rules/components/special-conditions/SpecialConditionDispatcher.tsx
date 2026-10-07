import type React from "react";
import { PptSpecialConditionEditor } from "../../../../pages/xml-rules/PptSpecialConditionForms";
import type {
	ImageInsertConfig,
	PictureBulletConfig,
	PictureStyleConfig,
	SpecialCondition,
	TextBoxContainsTextConfig,
} from "../../../../types/xml-grading-rules.types";
import InsertedImageEditor from "../../InsertedImageEditor";
import PictureBulletEditor from "../../PictureBulletEditor";
import PictureStyleEditor from "../../PictureStyleEditor";
import TextBoxContainsTextEditor from "../../TextBoxContainsTextEditor";
import { JsonConfigEditor } from "../common/JsonConfigEditor";
import { ExcelSpecialConditionEditor } from "./ExcelSpecialConditionEditor";
import { WordSpecialConditionEditor } from "./WordSpecialConditionEditor";

export interface SpecialConditionDispatcherProps {
	specialCondition?: SpecialCondition;
	getAccessToken: () => Promise<string>;
	onChange: (specialCondition: SpecialCondition) => void;
}

export const SpecialConditionDispatcher: React.FC<
	SpecialConditionDispatcherProps
> = ({ specialCondition, getAccessToken, onChange }) => {
	if (!specialCondition?.type) return null;

	const { type } = specialCondition;

	// 1. Standalone specialized editors
	if (type === "pictureBullet") {
		return (
			<PictureBulletEditor
				config={specialCondition.config as PictureBulletConfig}
				getAccessToken={getAccessToken}
				onChange={(config: PictureBulletConfig) => {
					onChange({
						...specialCondition,
						type: "pictureBullet",
						config,
					});
				}}
			/>
		);
	}

	if (type === "insertedImage") {
		return (
			<InsertedImageEditor
				config={specialCondition.imageInsertConfig as ImageInsertConfig}
				getAccessToken={getAccessToken}
				onChange={(imageInsertConfig: ImageInsertConfig) => {
					onChange({
						...specialCondition,
						type: "insertedImage",
						imageInsertConfig,
					});
				}}
			/>
		);
	}

	if (type === "pictureStyle") {
		return (
			<PictureStyleEditor
				config={specialCondition.pictureStyleConfig as PictureStyleConfig}
				getAccessToken={getAccessToken}
				onChange={(pictureStyleConfig: PictureStyleConfig) => {
					onChange({
						...specialCondition,
						type: "pictureStyle",
						pictureStyleConfig,
					});
				}}
			/>
		);
	}

	if (type === "textBoxContainsText") {
		return (
			<TextBoxContainsTextEditor
				config={
					specialCondition.textBoxContainsTextConfig as TextBoxContainsTextConfig
				}
				inputClass="w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2.5 text-sm text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest"
				onChange={(textBoxContainsTextConfig: TextBoxContainsTextConfig) => {
					onChange({
						...specialCondition,
						type: "textBoxContainsText",
						textBoxContainsTextConfig,
					});
				}}
			/>
		);
	}

	// 2. PowerPoint Special Conditions
	if (type.startsWith("ppt")) {
		return (
			<PptSpecialConditionEditor
				specialCondition={specialCondition}
				inputClass="w-full rounded-xl bg-m3-surface-container-high px-3.5 py-2.5 text-sm text-m3-on-surface outline-none transition focus:bg-m3-surface-container-highest"
				onChange={onChange}
			/>
		);
	}

	// 3. Excel Special Conditions
	if (type.startsWith("excel")) {
		return (
			<ExcelSpecialConditionEditor
				specialCondition={specialCondition}
				onChange={onChange}
			/>
		);
	}

	// 4. Word Special Conditions
	const wordComponent = (
		<WordSpecialConditionEditor
			specialCondition={specialCondition}
			onChange={onChange}
		/>
	);
	if (wordComponent) {
		return wordComponent;
	}

	// 5. Fallback JSON Editor
	return (
		<div className="mt-4 rounded-2xl bg-m3-surface-container p-4">
			<JsonConfigEditor
				initialConfig={specialCondition.config ?? {}}
				configKey="config"
				onUpdate={(_, config) => {
					onChange({
						...specialCondition,
						config: config as Record<string, unknown>,
					});
				}}
			/>
		</div>
	);
};
