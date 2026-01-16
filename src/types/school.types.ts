export interface School {
    id: string;
    name: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    website?: string;
    description?: string;
    logo?: string | null;
    ownerId?: string;
    ownerName?: string | null;
    createdAt?: string;
    isActive?: boolean;
}
export interface CreateSchoolRequest {
    name: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    website?: string;
    description?: string;
}
