


export interface PlotData {
  id: string;
  plotNumber: string;
  size?: string;
  details?: string;
  x: number;
  y: number;
  imageIndex: number;
  color?: string;

  status: 'available' | 'sold' | 'rented' | 'installment';

  // For 'sold' status
  saleDetails?: {
    buyerName: string;
    buyerContact?: string;
    price: number;
    date: string; // ISO
  };

  // For 'rented' status
  rentalDetails?: {
    tenantName: string;
    tenantContact?: string;
    rentAmount: number;
    rentFrequency: 'monthly' | 'yearly';
    startDate: string; // ISO
  };

  // For 'installment' status
  installmentDetails?: {
    buyerName: string;
    buyerContact?: string;
    totalPrice: number;
    downPayment: number;
    duration: number;
    frequency: 'monthly' | 'yearly';
    purchaseDate: string; // ISO
  };
}


export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string; // ISO String
  activePlan?: boolean;
  role?: 'admin' | 'manager' | 'agent';
  adminId?: string | null; // For employees, the UID of their admin
}

export interface Property {
  id:string;
  userId: string;
  createdAt: string; // ISO date string
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
  buyerContact?: string;
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
  
  // Sold related
  isSold?: boolean;
  salePrice?: number;
  saleDate?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  createdBy?: string; // UID of user (admin or employee) who logged the transaction
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

// Derived type for the Installments Page
export interface InstallmentItem {
    id: string; // property.id or plot.id
    source: 'property' | 'plot';
    propertyId: string;
    propertyName: string;
    address: string;
    plotNumber?: string;
    buyerName: string;
    buyerContact?: string;
    totalInstallmentPrice: number;
    paidAmount: number;
    remainingAmount: number;
    nextDueDate?: string; // Calculated next installment due date
    status: 'Active' | 'Overdue' | 'Fully Paid';
    paidInstallments: number;
    totalInstallments: number;
    installmentAmount: number; // The calculated amount for each installment
}


// Derived type for the Rentals page
export interface RentalItem {
  id: string; // property.id if top-level, plot.id if plot-level
  source: 'property' | 'plot'; // to know how to handle updates/deletes
  propertyId: string;
  propertyName: string;
  address: string;
  plotNumber?: string;
  tenantName: string;
  tenantContact?: string;
  rentAmount: number;
  rentFrequency: 'monthly' | 'yearly';
  startDate: string;
  nextDueDate?: string; // ISO Date String
  paymentStatus: 'Paid' | 'Due';
}


export interface Employee {
  id: string;
  userId: string; // The admin who created the employee record
  authUid?: string; // The actual Firebase Auth UID of the employee, once they register
  createdAt: string; // ISO date string
  name: string;
  position: string;
  email: string;
  phone?: string;
  hireDate: string; // ISO date string
  avatarUrl?: string;
  department?: string;
  role: 'manager' | 'agent';
  status?: 'pending' | 'active';
  salesCount?: number; // For tracking performance
  leadsCount?: number; // For tracking performance
}

export interface Lead {
  id: string;
  userId: string;
  createdBy?: string; // UID of user (admin or employee) who created the lead
  name: string;
  company?: string;
  address?: string;
  contact?: string;
  value: number;
  status: 'New' | 'Active' | 'Deal' | 'Done';
  lastUpdate: string; // ISO Date String
  latitude?: number | null;
  longitude?: number | null;
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  createdBy?: string; // UID of user who created the event
  createdAt: string; // ISO
  title: string;
  start: string; // ISO
  end?: string; // ISO
  allDay: boolean;
  type: 'event' | 'meeting' | 'holiday';
  details?: string;
}
