
export interface PlotData {
  id: string;
  plotNumber: string;
  buyerName: string;
  buyerContact: string;
  price: number;
  x: number; // Percentage from left
  y: number; // Percentage from top
  size?: string; // e.g., "5 Marla", "1 Kanal", "250 Sq. Yd."
  details?: string; // Optional additional details
}

export interface Property {
  id:string;
  name: string;
  address: string;
  imageUrl?: string;
  imageFile?: File; // For local preview before upload
  imageType?: 'photo' | 'pdf'; // To distinguish file types
  propertyType?: string; // e.g., "Residential Plot", "Commercial Plot", "House", "File", "Shop", "Apartment"
  plots: PlotData[];

  // Location on map
  latitude?: number;
  longitude?: number;

  // Installment related
  isSoldOnInstallment?: boolean;
  purchaseDate?: string; // ISO date string
  totalInstallmentPrice?: number;

  // Rental related
  isRented?: boolean;
  tenantName?: string;
  rentAmount?: number;
  nextRentDueDate?: string; // ISO date string for the next due date
}

export interface PaymentRecord {
  id: string;
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
  // Potentially add rentPaymentStatus derived in mock-db if needed
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  email: string;
  phone?: string;
  hireDate: string; // ISO date string
  avatarUrl?: string;
  department?: string;
}

