export interface User {
    id: string;
    email: string;
    password: string;
    profileImageUrl: string | null;
    createdAt: number;
    permissions: string[];
    emailVerified: boolean;
}

export type Permission = 'Admin' | 'Marketing' | 'add others here.'