export interface List {
    data: Data[],
    pagination: {
        page        : number;
        limit       : number;
        totalPage   : number;
        total       : number;
    };
}

export interface Data {
    id: number,
    type_id?: number,
    code: string,
    name: string,
    image: string,
    unit_price: number,
    total_sale: number,
    created_at: Date,
    type: { id: number, name: string }
    creator: { id: number, name: string, avatar: string }
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
