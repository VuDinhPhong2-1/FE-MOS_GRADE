import { Icon } from "@bug-on/m3-expressive/core";
import { Card, ScrollArea, Text } from "@bug-on/m3-expressive/layout";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { RouteLoadingFallback } from "../../components/common";
import { AssignmentGrid } from "./components/AssignmentGrid";
import { IdentitySection } from "./components/IdentitySection";
import { LeaderboardSection } from "./components/LeaderboardSection";
import { PortalHeader } from "./components/PortalHeader";
import { PortalTabs } from "./components/PortalTabs";
import { usePortalData } from "./hooks/usePortalData";
import { useStudentFilter } from "./hooks/useStudentFilter";
import { useSubmission } from "./hooks/useSubmission";

export const SubmissionPortalPage = () => {
	const { token = "" } = useParams<{ token: string }>();
	const [tab, setTab] = useState<"submit" | "leaderboard">("submit");

	const {
		info,
		loading,
		message,
		setMessage,
		classId,
		setClassId,
		studentId,
		setStudentId,
		students,
		loadingStudents,
		leaderboard,
		loadingLeaderboard,
		isRefreshingLeaderboard,
		lastLeaderboardUpdated,
		autoRefreshLeaderboard,
		setAutoRefreshLeaderboard,
		selectedClass,
		selectedStudent,
		visibleAssignments,
		loadLeaderboard,
	} = usePortalData(token, {
		isLeaderboardActive: tab === "leaderboard",
	});

	const { setStudentSearch, filteredStudents } = useStudentFilter(students);

	const {
		files,
		attachments,
		results,
		submittingAssignmentId,
		previewingAssignmentId,
		draggingAssignmentId,
		setDraggingAssignmentId,
		submit,
		handleFileSelected,
	} = useSubmission({
		token,
		classId,
		studentId,
		setMessage,
		onSubmissionSuccess: loadLeaderboard,
	});

	const { completedCount, earnedScore, totalMaxScore } = useMemo(() => {
		let completed = 0;
		let earned = 0;
		let totalMax = 0;
		for (const a of visibleAssignments) {
			totalMax += a.maxScore || 0;
			const res = results[a.id];
			if (res && !res.isPreview) {
				completed++;
				if (typeof res.scoreValue === "number") {
					earned += res.scoreValue;
				}
			}
		}
		return {
			completedCount: completed,
			earnedScore: earned,
			totalMaxScore: totalMax,
		};
	}, [visibleAssignments, results]);

	const handleRefreshLeaderboard = useCallback(() => {
		void loadLeaderboard(true);
	}, [loadLeaderboard]);

	if (loading && !info) {
		return (
			<RouteLoadingFallback fullScreen message="Đang mở cổng nộp bài..." />
		);
	}

	if (!info) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-m3-surface-container p-6 text-m3-on-surface">
				<Card
					variant="filled"
					className="max-w-md bg-m3-error-container p-8 text-center text-m3-on-error-container rounded-m3-xl"
				>
					<Icon name="error" size={48} className="mx-auto text-m3-error" />
					<Text variant="headline-sm" className="mt-3 font-bold">
						Không mở được cổng nộp bài
					</Text>
					<Text variant="body-md" className="mt-2 opacity-80">
						{message || "Link không tồn tại hoặc đã bị đóng."}
					</Text>
				</Card>
			</div>
		);
	}

	return (
		<div
			className="flex h-screen flex-col overflow-hidden bg-m3-primary text-m3-on-primary"
			style={{
				height: "100dvh",
				paddingLeft: "env(safe-area-inset-left)",
				paddingRight: "env(safe-area-inset-right)",
			}}
		>
			<PortalHeader
				title={info.title}
				description={info.description}
				classesCount={info.classes.length}
				assignmentsCount={info.assignments.length}
				maxSubmissionsPerStudent={info.maxSubmissionsPerStudent}
			/>
			<main className="flex w-full flex-1 min-h-0 flex-col px-3 pb-3 pt-0 overflow-hidden">
				<div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-m3-xl-inc bg-m3-surface-container-low text-m3-on-surface">
					<ScrollArea
						type="hover"
						orientation="vertical"
						className="flex-1 min-h-0"
						viewportClassName="p-6 space-y-6"
					>
						{message && (
							<Card
								variant="filled"
								className="flex items-center gap-2 bg-m3-error-container p-4 text-m3-on-error-container rounded-m3-xl"
							>
								<Icon name="info" size={20} />
								<Text variant="body-md" className="text-m3-on-error-container">
									{message}
								</Text>
							</Card>
						)}

						<PortalTabs
							tab={tab}
							onTabChange={setTab}
							showLeaderboard={Boolean(info.showLeaderboard)}
							submitContent={
								<>
									<IdentitySection
										classes={info.classes}
										classId={classId}
										onClassChange={setClassId}
										onStudentSearchChange={setStudentSearch}
										filteredStudents={filteredStudents}
										students={students}
										studentId={studentId}
										onStudentChange={setStudentId}
										loadingStudents={loadingStudents}
										selectedClass={selectedClass}
										selectedStudent={selectedStudent}
										completedCount={completedCount}
										totalAssignmentsCount={visibleAssignments.length}
										earnedScore={earnedScore}
										totalMaxScore={totalMaxScore}
									/>

									<AssignmentGrid
										assignments={visibleAssignments}
										files={files}
										attachments={attachments}
										results={results}
										submittingAssignmentId={submittingAssignmentId}
										previewingAssignmentId={previewingAssignmentId}
										draggingAssignmentId={draggingAssignmentId}
										confirmedIdentity={Boolean(classId && studentId)}
										showDetailedFeedback={Boolean(info.showDetailedFeedback)}
										onFileSelect={handleFileSelected}
										onSubmit={submit}
										onDragChange={setDraggingAssignmentId}
									/>
								</>
							}
							leaderboardContent={
								<LeaderboardSection
									leaderboard={leaderboard}
									loadingLeaderboard={loadingLeaderboard}
									isRefreshing={isRefreshingLeaderboard}
									lastUpdatedAt={lastLeaderboardUpdated}
									selectedClass={selectedClass}
									classes={info.classes}
									classId={classId}
									onClassChange={setClassId}
									currentStudentId={studentId}
									onRefresh={handleRefreshLeaderboard}
									autoRefresh={autoRefreshLeaderboard}
									onToggleAutoRefresh={setAutoRefreshLeaderboard}
								/>
							}
						/>
					</ScrollArea>
				</div>
			</main>
		</div>
	);
};

export default SubmissionPortalPage;
