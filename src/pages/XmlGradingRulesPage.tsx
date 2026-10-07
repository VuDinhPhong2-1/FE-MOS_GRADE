import type React from "react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { usePageHeader } from "../context/PageActionsContext";
import {
	ProjectListSection,
	RulesetFloatingToolbar,
	RulesetMetadataForm,
	RulesetOverviewHeader,
	RulesetSidebar,
	TestGradingTabContent,
	ValidationTabContent,
} from "../features/xml-grading-rules";
import {
	useRuleEditor,
	useRuleValidation,
	useTestGrading,
	useXmlGradingRules,
} from "../features/xml-grading-rules/hooks";

export const XmlGradingRulesPage: React.FC = () => {
	const { getAccessToken } = useAuth();
	const [activeTab, setActiveTab] = useState<"editor" | "validation" | "test">(
		"editor",
	);

	const {
		canUsePage,
		ruleSets,
		selected,
		replaceSelected,
		updateSelected,
		subjectFilter,
		setSubjectFilter,
		activeFilter,
		setActiveFilter,
		loading,
		loadingRuleSetId,
		saving,
		importInputRef,
		startNewRuleSet,
		openRuleSet,
		handleImportFile,
		handleSeedPptGm2,
		handleExportJson,
		saveRuleSet,
		deleteRuleSet,
	} = useXmlGradingRules();

	const editor = useRuleEditor(selected, updateSelected);
	const { validation, isValidating, validateRuleSet } = useRuleValidation();
	const testGrading = useTestGrading();

	usePageHeader(
		{
			title: "XML Grading Rules",
			subtitle: `Quản lý ruleset · project · task · điều kiện chấm (${
				selected.isActive ? "ACTIVE" : "INACTIVE"
			})`,
			actions: [
				{
					id: "create-ruleset",
					label: "Tạo ruleset",
					icon: "add",
					colorStyle: "filled",
					onClick: startNewRuleSet,
				},
			],
		},
		[selected.isActive, startNewRuleSet],
	);

	if (!canUsePage) {
		return (
			<div className="rounded-3xl bg-m3-error-container p-6 text-m3-on-error-container">
				Chỉ tài khoản Admin được quản lý XML grading rules.
			</div>
		);
	}

	return (
		<div className="min-h-full space-y-6 pb-24">
			{/* Hidden file input for importing JSON */}
			<input
				type="file"
				ref={importInputRef}
				accept=".json,application/json"
				className="hidden"
				onChange={handleImportFile}
			/>

			{/* Main Layout: 2 Columns (Sidebar + Content) */}
			<div className="flex flex-col gap-6 lg:flex-row">
				{/* Sidebar */}
				<RulesetSidebar
					ruleSets={ruleSets}
					selectedId={selected.id || ""}
					subjectFilter={subjectFilter}
					onSubjectFilterChange={setSubjectFilter}
					activeFilter={activeFilter}
					onActiveFilterChange={setActiveFilter}
					onSelectRuleSet={openRuleSet}
					onCreateNew={startNewRuleSet}
					onSeedPptGm2={handleSeedPptGm2}
					onImportClick={() => importInputRef.current?.click()}
					loading={loading}
					loadingRuleSetId={loadingRuleSetId}
				/>

				{/* Main Content Workspace */}
				<main className="min-w-0 flex-1 space-y-6">
					{/* Ruleset Overview Header */}
					<RulesetOverviewHeader
						selected={selected}
						onExportJson={handleExportJson}
						onDeleteRuleSet={deleteRuleSet}
					/>

					{/* Tab Content: Editor */}
					{activeTab === "editor" && (
						<div className="space-y-6">
							<RulesetMetadataForm
								selected={selected}
								onChange={replaceSelected}
							/>

							<ProjectListSection
								selected={selected}
								expandedProjects={editor.expandedProjects}
								onToggleProject={editor.toggleProject}
								expandedTasks={editor.expandedTasks}
								onToggleTask={editor.toggleTask}
								expandedSpecialConditions={editor.expandedSpecialConditions}
								onToggleSpecialCondition={editor.toggleSpecialCondition}
								expandedConditionBasics={editor.expandedConditionBasics}
								onToggleConditionBasics={editor.toggleConditionBasics}
								showAdvanced={editor.showAdvanced}
								onToggleAdvanced={editor.toggleAdvanced}
								onMutateProject={editor.mutateProject}
								onMutateTask={editor.mutateTask}
								onMutateCondition={editor.mutateCondition}
								onUpdateSpecialCondition={editor.updateTaskSpecialCondition}
								onAddProject={editor.addProject}
								onRemoveProject={editor.removeProject}
								onAddTask={editor.addTask}
								onRemoveTask={editor.removeTask}
								onAddCondition={editor.addCondition}
								onRemoveCondition={editor.removeCondition}
								getAccessToken={async () => (await getAccessToken()) || ""}
							/>
						</div>
					)}

					{/* Tab Content: Validation */}
					{activeTab === "validation" && (
						<ValidationTabContent
							validation={validation}
							isValidating={isValidating}
							onValidate={() => void validateRuleSet(selected)}
						/>
					)}

					{/* Tab Content: Test XML */}
					{activeTab === "test" && (
						<TestGradingTabContent
							selected={selected}
							gradeProjectCode={testGrading.gradeProjectCode}
							onProjectCodeChange={testGrading.setGradeProjectCode}
							gradeFile={testGrading.gradeFile}
							onFileChange={testGrading.setGradeFile}
							gradeAttachmentFile={testGrading.gradeAttachmentFile}
							onAttachmentFileChange={testGrading.setGradeAttachmentFile}
							gradeJson={testGrading.gradeJson}
							isTestGrading={testGrading.isTestGrading}
							onStartGrade={() => void testGrading.gradeWithXmlRules(selected)}
						/>
					)}
				</main>
			</div>

			{/* Floating Toolbar with shortcut Ctrl+S support */}
			<RulesetFloatingToolbar
				isSaving={saving}
				isValidating={isValidating}
				hasUnsavedChanges={false}
				onSave={() => void saveRuleSet()}
				onValidate={() => void validateRuleSet(selected)}
				activeTab={activeTab}
				onTabChange={setActiveTab}
				validationCount={
					validation
						? {
								errors: validation.errors?.length || 0,
								warnings: validation.warnings?.length || 0,
							}
						: null
				}
			/>
		</div>
	);
};

export default XmlGradingRulesPage;
