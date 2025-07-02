
export interface PlotData {
  id: string;
  plotNumber: string;
  buyerName: string;
  buyerContact: string;
  price: number;
  x: number; // Percentage from left
  y: number; // Percentage from top
  imageIndex: number; // Index in the property's imageUrls array
  size?: string; // e.g., "5 Marla", "1 Kanal", "250 Sq. Yd."
  details?: string; // Optional additional details
  color?: string; // Color for the map pin
}

export interface Property {
  id:string;
  userId: string;
  name: string;
  address: string;
  imageUrls?: string[];
  propertyType?: string; // e.g., "Residential Plot", "Commercial Plot", "House", "File", "Shop", "Apartment"
  plots: PlotData[];

  latitude?: number | null;
  longitude?: number | null;

  // Installment related
  isSoldOnInstallment?: boolean;
  purchaseDate?: string; // ISO date string
  totalInstallmentPrice?: number;

  // Rental related
  isRented?: boolean;
  tenantName?: string;
  rentAmount?: number;
  rentFrequency?: 'monthly' | 'yearly';
  rentStartDate?: string; // ISO date string
}

export interface PaymentRecord {
  id: string;
  userId: string;
  propertyId: string;
  propertyName?: string; // For display convenience
  plotNumber?: string; // For display convenience
  tenantOrBuyerName: string; // Could be tenant for rent, buyer for installment/sale
  amount: number;
  date: string; // ISO date string
  paymentMethod?: string;
  type: 'rent' | 'installment' | 'sale' | 'token'; // Added 'token' as a common payment type
  notes?: string;
}

export interface InstallmentDetails extends Property {
  paidAmount?: number;
  remainingAmount?: number;
  nextDueDate?: string; // Calculated next installment due date
}

export interface RentedPropertyDetails extends Property {
  lastRentPaymentDate?: string; // ISO date string of the last rent payment
  nextRentDueDate?: string; // Calculated next due date
  status?: 'Active' | 'Overdue'; // Derived from nextRentDueDate
}

export interface Employee {
  id: string;
  userId: string;
  name: string;
  position: string;
  email: string;
  phone?: string;
  hireDate: string; // ISO date string
  avatarUrl?: string;
  department?: string;
}
