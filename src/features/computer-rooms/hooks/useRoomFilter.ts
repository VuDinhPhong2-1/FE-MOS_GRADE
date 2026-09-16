import { useCallback, useMemo, useState } from "react";
import type { ComputerRoom } from "../../../types/computer-room.types";
import type { RoomFilterStatus } from "../types";

export const useRoomFilter = (rooms: ComputerRoom[]) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<RoomFilterStatus>("all");
	const [isSearchActive, setIsSearchActive] = useState(false);

	const openSearch = useCallback(() => {
		setIsSearchActive(true);
	}, []);

	const closeSearch = useCallback(() => {
		setIsSearchActive(false);
		setSearchQuery("");
	}, []);

	const filteredRooms = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();

		return rooms.filter((room) => {
			// Filter by status
			if (statusFilter === "active" && !room.isActive) return false;
			if (statusFilter === "inactive" && room.isActive) return false;

			// Filter by search query
			if (normalizedQuery) {
				const nameMatch = room.name.toLowerCase().includes(normalizedQuery);
				const detailMatch =
					room.brokenMachinesDetail?.toLowerCase().includes(normalizedQuery) ??
					false;
				if (!nameMatch && !detailMatch) return false;
			}

			return true;
		});
	}, [rooms, searchQuery, statusFilter]);

	const hasActiveFilters =
		statusFilter !== "all" || Boolean(searchQuery.trim());

	return {
		searchQuery,
		setSearchQuery,
		statusFilter,
		setStatusFilter,
		isSearchActive,
		setIsSearchActive,
		openSearch,
		closeSearch,
		filteredRooms,
		totalCount: rooms.length,
		displayedCount: filteredRooms.length,
		hasActiveFilters,
	};
};
