export interface List {
    data: Data[],
    pagination: {
        page        : number;
        limit       : number;
        totalPage   : number;
        total       : number;
    };
}

export interface MenuSizeData {
    id?: number;
    size: 'S' | 'M' | 'L';
    price: number;
    recipes: { ingredient_id: number; quantity: number }[];
}

export interface Data {
    id: number,
    type_id?: number,
    code: string,
    name: string,
    image: string,
    has_sizes?: boolean,
    unit_price: number,
    sizes?: MenuSizeData[],
    total_sale: number,
    total_revenue?: number,
    is_available?: boolean,
    created_at: Date,
    type: { id: number, name: string }
    creator?: { id: number, name: string, avatar: string }
    /** Per-serving recipe lines — used only when has_sizes is false */
    recipes?: { ingredient_id: number; quantity: number }[];
}

export interface ProductType {
    id: number;
    name: string;
}

export interface User {
    id: number;
    name: string;
}

// Interface for Setup Response
export interface SetupResponse {

    productTypes: ProductType[];
    users: User[];
}
