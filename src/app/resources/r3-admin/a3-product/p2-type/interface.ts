export interface Data {

    data: Item[]
}

export interface Item {
    id              : number,
    name            : string,
    image           : string,
    created_at      : Date
    n_of_products   : number,
}

export interface CreatePayload {
    name            : string;
    image           : string;
}

export interface UpdatePayload {
    name            : string;
    image           : string;
}
