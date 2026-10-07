import { useCallback, useEffect, useRef, useState } from "react";
import { showConfirm } from "../../../components/common";
import { useAuth } from "../../../context/AuthContext";
import { xmlGradingRulesService } from "../../../services/xml-grading-rules.service";
import type {
	GradingRuleSet,
	GradingRuleSetSummary,
} from "../../../types/xml-grading-rules.types";
import { notify } from "../../../utils/notify";
import { hasPermission } from "../../../utils/permissions";
import {
	emptyRuleSet,
	normalizeSubject,
	prepareRuleSet,
	toRuleSetSummary,
} from "../utils/xml-rule-helpers";

export const useXmlGradingRules = () => {
	const { getAccessToken, user } = useAuth();
	const [ruleSets, setRuleSets] = useState<GradingRuleSetSummary[]>([]);
	const [selected, setSelected] = useState<GradingRuleSet>(emptyRuleSet());
	const [subjectFilter, setSubjectFilter] = useState("");
	const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">(
		"all",
	);
	const [loading, setLoading] = useState(false);
	const [loadingRuleSetId, setLoadingRuleSetId] = useState("");
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState("");

	const selectedRef = useRef(selected);
	const saveScrollYRef = useRef(0);
	const savingRef = useRef(false);
	const saveRuleSetRef = useRef<() => Promise<void>>(async () => undefined);
	const importInputRef = useRef<HTMLInputElement>(null);

	const canUsePage = hasPermission(user, "xmlrules.view");

	useEffect(() => {
		selectedRef.current = selected;
	}, [selected]);

	const loadRuleSets = useCallback(async () => {
		setLoading(true);
		try {
			const data = await xmlGradingRulesService.listSummaries(getAccessToken, {
				subject: subjectFilter.trim() || undefined,
				isActive: activeFilter === "all" ? undefined : activeFilter === "true",
			});
			setRuleSets(data);
		} catch (error) {
			notify.error(
				error instanceof Error
					? error.message
					: "Không tải được danh sách XML rules.",
			);
		} finally {
			setLoading(false);
		}
	}, [activeFilter, getAccessToken, subjectFilter]);

	useEffect(() => {
		void loadRuleSets();
	}, [loadRuleSets]);

	const replaceSelected = useCallback((next: GradingRuleSet) => {
		selectedRef.current = next;
		setSelected(next);
		setRuleSets((items) => {
			if (!next.id) return items;
			const summary = toRuleSetSummary(next);
			const exists = items.some((item) => item.id === next.id);
			return exists
				? items.map((item) => (item.id === next.id ? summary : item))
				: [summary, ...items];
		});
	}, []);

	const updateSelected = useCallback(
		(updater: (current: GradingRuleSet) => GradingRuleSet) => {
			const next = updater(selectedRef.current);
			selectedRef.current = next;
			setSelected(next);
			const summary = toRuleSetSummary(next);
			setRuleSets((items) =>
				next.id
					? items.map((item) => (item.id === next.id ? summary : item))
					: items,
			);
		},
		[],
	);

	const startNewRuleSet = useCallback(() => {
		const defaultSub = normalizeSubject(subjectFilter) || "excel";
		const next = emptyRuleSet(defaultSub);
		selectedRef.current = next;
		setSelected(next);
	}, [subjectFilter]);

	const openRuleSet = useCallback(
		async (summary: GradingRuleSetSummary) => {
			setLoadingRuleSetId(summary.id);
			try {
				const detail = await xmlGradingRulesService.get(
					summary.id,
					getAccessToken,
				);
				replaceSelected(detail);
			} catch (error) {
				notify.error(
					error instanceof Error
						? error.message
						: "Không tải được chi tiết XML ruleset.",
				);
			} finally {
				setLoadingRuleSetId("");
			}
		},
		[getAccessToken, replaceSelected],
	);

	const handleImportFile = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			try {
				setLoading(true);
				const text = await file.text();
				const parsed = JSON.parse(text) as GradingRuleSet;
				if (!parsed.subject || !Array.isArray(parsed.projects)) {
					notify.error(
						"File JSON không hợp lệ. Cần có trường 'subject' và danh sách 'projects'.",
					);
					return;
				}
				const payload: Partial<GradingRuleSet> = {
					subject: parsed.subject,
					version: parsed.version || "v1",
					isActive: parsed.isActive ?? true,
					projects: parsed.projects,
				};
				const created = await xmlGradingRulesService.create(
					payload,
					getAccessToken,
				);
				notify.success(
					`Đã nhập thành công bộ luật môn ${created.subject.toUpperCase()} (${created.version}) với ${created.projects?.length || 0} projects!`,
				);
				await loadRuleSets();
				replaceSelected(created);
			} catch (err) {
				notify.error(
					err instanceof Error ? err.message : "Không thể nhập file JSON.",
				);
			} finally {
				setLoading(false);
				if (e.target) e.target.value = "";
			}
		},
		[getAccessToken, loadRuleSets, replaceSelected],
	);

	const handleSeedPptGm2 = useCallback(async () => {
		setLoading(true);
		try {
			const ruleSet = await xmlGradingRulesService.seedPptGm2(getAccessToken);
			notify.success(
				`Đã nạp thành công bộ luật mẫu PowerPoint GM2 (${ruleSet.projects?.length || 0} projects, 1000 điểm)!`,
			);
			await loadRuleSets();
			replaceSelected(ruleSet);
		} catch (err) {
			notify.error(
				err instanceof Error
					? err.message
					: "Không thể nạp dữ liệu mẫu PPT GM2.",
			);
		} finally {
			setLoading(false);
		}
	}, [getAccessToken, loadRuleSets, replaceSelected]);

	const handleExportJson = useCallback(() => {
		if (!selected.subject && selected.projects.length === 0) {
			notify.error("Không có dữ liệu ruleset để xuất.");
			return;
		}
		const exportData: Partial<GradingRuleSet> = {
			subject: selected.subject,
			version: selected.version,
			isActive: selected.isActive,
			projects: selected.projects,
		};
		const filename = `${selected.subject || "ruleset"}-${selected.version || "export"}-rules.json`;
		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
		notify.success(`Đã xuất file ${filename}`);
	}, [selected]);

	const saveRuleSet = useCallback(async () => {
		if (savingRef.current) return;
		savingRef.current = true;

		saveScrollYRef.current = window.scrollY;
		setSaveError("");

		const current = selectedRef.current;
		setSaving(true);

		try {
			const payload = prepareRuleSet(current);
			const saved = current.id
				? await xmlGradingRulesService.update(
						current.id,
						payload,
						getAccessToken,
					)
				: await xmlGradingRulesService.create(payload, getAccessToken);

			replaceSelected(saved);
			selectedRef.current = saved;

			await loadRuleSets();
			notify.success("Đã lưu ruleset XML.");

			requestAnimationFrame(() => {
				window.scrollTo({ top: saveScrollYRef.current, behavior: "auto" });
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Lưu ruleset thất bại.";
			setSaveError(message);
			notify.error(message);

			requestAnimationFrame(() => {
				window.scrollTo({ top: saveScrollYRef.current, behavior: "auto" });
			});
		} finally {
			setSaving(false);
			savingRef.current = false;
		}
	}, [getAccessToken, loadRuleSets, replaceSelected]);

	useEffect(() => {
		saveRuleSetRef.current = saveRuleSet;
	});

	useEffect(() => {
		const isSaveShortcut = (event: KeyboardEvent) =>
			(event.ctrlKey || event.metaKey) &&
			(event.key.toLowerCase() === "s" || event.code === "KeyS");

		const handleSaveShortcut = (event: KeyboardEvent) => {
			if (!isSaveShortcut(event)) return;
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			void saveRuleSetRef.current();
		};

		window.addEventListener("keydown", handleSaveShortcut, {
			capture: true,
			passive: false,
		});
		document.addEventListener("keydown", handleSaveShortcut, {
			capture: true,
			passive: false,
		});

		return () => {
			window.removeEventListener("keydown", handleSaveShortcut, {
				capture: true,
			});
			document.removeEventListener("keydown", handleSaveShortcut, {
				capture: true,
			});
		};
	}, []);

	const deleteRuleSet = useCallback(
		async (id: string) => {
			const confirmed = await showConfirm({
				title: "Xác nhận xóa ruleset",
				message: "Bạn có chắc chắn muốn xóa ruleset này?",
				confirmLabel: "Xác nhận xóa",
				variant: "destructive",
			});
			if (!confirmed) return;
			await xmlGradingRulesService.delete(id, getAccessToken);
			startNewRuleSet();
			await loadRuleSets();
			notify.success("Đã xóa ruleset.");
		},
		[getAccessToken, loadRuleSets, startNewRuleSet],
	);

	return {
		canUsePage,
		ruleSets,
		selected,
		selectedRef,
		setSelected,
		replaceSelected,
		updateSelected,
		subjectFilter,
		setSubjectFilter,
		activeFilter,
		setActiveFilter,
		loading,
		loadingRuleSetId,
		saving,
		saveError,
		setSaveError,
		importInputRef,
		loadRuleSets,
		startNewRuleSet,
		openRuleSet,
		handleImportFile,
		handleSeedPptGm2,
		handleExportJson,
		saveRuleSet,
		deleteRuleSet,
	};
};
