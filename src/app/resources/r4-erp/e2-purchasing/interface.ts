export interface ErpSupplier {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    payment_terms?: string;
    notes?: string;
    is_active: boolean;
    created_at?: string;
}

export interface ErpPurchaseOrder {
    id: number;
    po_number: string;
    supplier_id: number;
    supplier?: { id: number; name: string };
    order_date: string;
    expected_date?: string;
    status: 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';
    total_amount: number;
    notes?: string;
    items?: ErpPurchaseOrderItem[];
    created_at?: string;
}

export interface ErpPurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    ingredient_id?: number;
    item_name: string;
    quantity: number;
    received_quantity?: number;
    unit: string;
    unit_cost: number;
    total_cost: number;
}
