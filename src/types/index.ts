export interface PlotData {
  id: string;
  plotNumber: string;
  buyerName: string;
  buyerContact: string;
  price: number;
  x: number; // Percentage from left
  y: number; // Percentage from top
  details?: string; // Optional additional details
}

export interface Property {
  id:string;
  name: string;
  address: string;
  imageUrl?: string; 
  imageFile?: File; // For local preview before upload
  imageType?: 'photo' | 'pdf'; // To distinguish file types
  plots: PlotData[];
  isSoldOnInstallment?: boolean;
  purchaseDate?: string; // ISO date string
  totalInstallmentPrice?: number;
}

export interface PaymentRecord {
  id: string;
  propertyId: string; 
  propertyName?: string; // For display convenience
  plotNumber?: string; // For display convenience
  tenantOrBuyerName: string;
  amount: number;
  date: string; // ISO date string
  paymentMethod?: string;
  type: 'rent' | 'installment' | 'sale';
  notes?: string;
}

export interface InstallmentDetails extends Property {
  // Specific installment fields can be added if needed, 
  // or rely on Property's installment fields and PaymentRecord for tracking
  paidAmount?: number;
  remainingAmount?: number;
  nextDueDate?: string;
}
