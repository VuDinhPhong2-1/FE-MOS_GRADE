import { useCallback, useMemo, useState } from "react";
import type { School } from "../../../types";
import type { SchoolStatusFilter } from "../types";

const normalizeText = (value?: string): string =>
	(value || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();

export const useSchoolFilter = (schools: School[]) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<SchoolStatusFilter>("all");
	const [isSearchActive, setIsSearchActive] = useState(false);

	const openSearch = useCallback(() => {
		setIsSearchActive(true);
	}, []);

	const closeSearch = useCallback(() => {
		setIsSearchActive(false);
		setSearchQuery("");
	}, []);

	const resetFilters = useCallback(() => {
		setSearchQuery("");
		setStatusFilter("all");
		setIsSearchActive(false);
	}, []);

	// Pre-normalize schools một lần khi danh sách thay đổi để tối ưu O(N) khi search
	const normalizedSchools = useMemo(() => {
		return schools.map((sch) => ({
			raw: sch,
			searchTarget: `${normalizeText(sch.name)} ${normalizeText(sch.code)} ${normalizeText(sch.address)}`,
		}));
	}, [schools]);

	const filteredSchools = useMemo(() => {
		const query = normalizeText(searchQuery);

		return normalizedSchools
			.filter(({ raw: sch, searchTarget }) => {
				// Status filter
				if (statusFilter === "active" && sch.isActive === false) {
					return false;
				}
				if (statusFilter === "inactive" && sch.isActive !== false) {
					return false;
				}

				// Query search
				if (query && !searchTarget.includes(query)) {
					return false;
				}

				return true;
			})
			.map(({ raw }) => raw);
	}, [normalizedSchools, searchQuery, statusFilter]);

	const hasActiveFilters = useMemo(
		() => searchQuery.trim().length > 0 || statusFilter !== "all",
		[searchQuery, statusFilter],
	);

	return {
		searchQuery,
		setSearchQuery,
		statusFilter,
		setStatusFilter,
		isSearchActive,
		openSearch,
		closeSearch,
		resetFilters,
		filteredSchools,
		hasActiveFilters,
		totalCount: schools.length,
		displayedCount: filteredSchools.length,
	};
};
