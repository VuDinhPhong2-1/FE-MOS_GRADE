import { Button } from "@bug-on/m3-expressive/buttons";
import { Icon } from "@bug-on/m3-expressive/core";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import {
	type ExcelExam02EvidenceSummary,
	xmlGradingRulesService,
} from "../../../../services/xml-grading-rules.service";
import { notify } from "../../../../utils/notify";

export function Exam02EvidenceReview() {
	const { getAccessToken } = useAuth();
	const [items, setItems] = useState<ExcelExam02EvidenceSummary[]>([]);
	const [busy, setBusy] = useState(false);
	const load = useCallback(async () => {
		try {
			setItems(await xmlGradingRulesService.listExam02Evidence(getAccessToken));
		} catch (error) {
			notify.error(error instanceof Error ? error.message : "Không tải được minh chứng.");
		}
	}, [getAccessToken]);

	useEffect(() => { void load(); }, [load]);

	const download = async (item: ExcelExam02EvidenceSummary) => {
		try {
			const blob = await xmlGradingRulesService.downloadExam02Evidence(item.id, getAccessToken);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = item.fileName;
			link.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (error) {
			notify.error(error instanceof Error ? error.message : "Không tải được tệp minh chứng.");
		}
	};

	const review = async (item: ExcelExam02EvidenceSummary, taskId: string, approved: boolean) => {
		setBusy(true);
		try {
			await xmlGradingRulesService.reviewExam02Evidence(item.id, taskId, approved, getAccessToken);
			await load();
			notify.success("Đã lưu kết quả duyệt. Chấm lại cùng workbook để cập nhật điểm.");
		} catch (error) {
			notify.error(error instanceof Error ? error.message : "Không lưu được kết quả duyệt.");
		} finally { setBusy(false); }
	};

	return <section className="space-y-3 border-t border-m3-outline-variant pt-4">
		<div className="flex items-center justify-between gap-2">
			<h3 className="text-sm font-semibold">Minh chứng Project 11</h3>
			<Button size="xs" colorStyle="outlined" icon={<Icon name="refresh" />} onClick={() => void load()}>Tải lại</Button>
		</div>
		{items.length === 0 && <p className="text-xs text-m3-on-surface-variant">Chưa có tệp minh chứng.</p>}
		{items.map(item => <div key={item.id} className="border-b border-m3-outline-variant py-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="min-w-0 text-xs">
					<div className="font-semibold break-all">{item.fileName}</div>
					<div className="text-m3-on-surface-variant break-all">{item.scope} · {new Date(item.submittedAtUtc).toLocaleString("vi-VN")}</div>
				</div>
				<Button size="xs" colorStyle="outlined" icon={<Icon name="download" />} onClick={() => void download(item)}>Tải tệp</Button>
			</div>
			{item.availableTaskIds.map(taskId => <div key={taskId} className="mt-2 flex flex-wrap items-center gap-2 text-xs">
				<span className="w-14 font-semibold">{taskId}</span>
				<span className="min-w-20 text-m3-on-surface-variant">{item.decisions?.[taskId] === "approved" ? "Đã duyệt" : item.decisions?.[taskId] === "rejected" ? "Từ chối" : "Chờ duyệt"}</span>
				<Button size="xs" colorStyle="outlined" disabled={busy} icon={<Icon name="check" />} onClick={() => void review(item, taskId, true)}>Duyệt</Button>
				<Button size="xs" colorStyle="outlined" disabled={busy} icon={<Icon name="close" />} onClick={() => void review(item, taskId, false)}>Từ chối</Button>
			</div>)}
		</div>)}
	</section>;
}
