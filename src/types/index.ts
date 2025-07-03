
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
  buyerName?: string; // For installment sales
  purchaseDate?: string; // ISO date string
  totalInstallmentPrice?: number;
  downPayment?: number;
  installmentFrequency?: 'monthly' | 'yearly';
  installmentDuration?: number; // Duration in months or years

  // Rental related
  isRented?: boolean;
  tenantName?: string;
  rentAmount?: number;
  rentFrequency?: 'monthly' | 'yearly';
  rentStartDate?: string; // ISO date string
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string; // e.g., 'rent', 'sale', 'maintenance', 'salary'
  amount: number;
  date: string; // ISO date string
  contactName: string; // Payer for income, Payee for expense
  propertyId?: string; // Optional: link transaction to a property
  propertyName?: string;
  plotNumber?: string;
  notes?: string;
}

export interface InstallmentDetails extends Property {
  paidAmount: number;
  remainingAmount: number;
  nextDueDate?: string; // Calculated next installment due date
  status: 'Active' | 'Overdue' | 'Fully Paid';
  paidInstallments: number;
  totalInstallments: number;
  installmentAmount: number; // The calculated amount for each installment
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

export interface Lead {
  id: string;
  userId: string;
  name: string;
  company?: string;
  contact?: string;
  value: number;
  status: 'New' | 'Active' | 'Deal' | 'Done';
  lastUpdate: string; // ISO Date String
  latitude?: number | null;
  longitude?: number | null;
  notes?: string;
}
