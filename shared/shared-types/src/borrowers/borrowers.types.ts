
type BorrowerStatus = 'enabled' | 'disabled' | 'withDebt' | 'active' | 'suspended';

interface BorrowerDTO {
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    phone: string;
    address?: string;
    gender?: string;
    status: BorrowerStatus;
    createdAt?: string;
}

interface CreateBorrowerDTO {
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    phone: string;
    address: string;
    gender?: string;
}

interface CreateBorrowerErrors {
    firstName?: string;
    lastName?: string;
    dni?: string;
    email?: string;
    phone?: string;
    address?: string;
    gender?: string;
}

interface UpdateBorrowerDTO extends BorrowerDTO {
    disableReason?: string;
};

interface UpdateBorrowerErrors {
    firstName?: {};
    lastName?: {};
    dni?: {};
    email?: {};
    phone?: {};
    address?: {};
    status?: {};
    disableReason?: {};
}

interface BorrowerGetAllParams {
    limit?: number;
    offset?: number;
    name?: string;
    surname?: string;
    dni?: string;
    status?: "all" | "enabled" | "disabled" | "withDebt";
}

export type {
    BorrowerStatus,
    BorrowerDTO,
    CreateBorrowerDTO,
    CreateBorrowerErrors,
    UpdateBorrowerDTO,
    UpdateBorrowerErrors,
    BorrowerGetAllParams
}
