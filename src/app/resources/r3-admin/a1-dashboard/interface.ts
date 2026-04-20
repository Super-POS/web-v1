export interface DashboardResponse {
    statatics: StataticData;
    message: string;
}
export interface StataticData {
    totalProduct: number;
    totalProductType: number;
    totalUser: number;
    totalOrder: number;
    total: string;
    totalPercentageIncrease: number;
    saleIncreasePreviousDay: string;
}

interface RoleDetails {
    id: number;
    name: string;
}

interface UserRole {
    id: number;
    role_id: number;
    role: RoleDetails;
}

export interface CashierDataResponse {
    id: number;
    name: string;
    avatar: string;
    totalAmount: number;
    percentageChange: number;
    role: UserRole[];
}

export interface DataCashierResponse {
    data: CashierData[];
}

export interface DataSaleResponse {
    labels: string[];
    data: number[];
}
export interface DashboardResponse {
    dashboard: {
      statistic: Statistic;
      salesData: SalesData;
      productTypeData: ProductTypeData;
      cashierData: CashierData;
    };
    message: string;
  }
  
  interface Statistic {
    totalProduct: number;
    totalProductType: number;
    totalUser: number;
    totalOrder: number;
    total: number;
    totalPercentageIncrease: number;
    saleIncreasePreviousDay: string;
  }
  
  export interface SalesData {
    labels: string[];
    data: number[];
  }
  
  export interface ProductTypeData {
    labels: string[];
    data: string[];
  }
  
  export interface CashierData {
    data: Cashier[];
  }
  
  interface Cashier {
    id: number;
    name: string;
    avatar: string;
    totalAmount: number;
    percentageChange: string;
    role: RoleDetail[];
  }
  
  interface RoleDetail {
    id: number;
    role_id: number;
    role: Role;
  }
  
  interface Role {
    id: number;
    name: string;
  }
  