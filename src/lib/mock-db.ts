
import type { Property, Employee, PaymentRecord, InstallmentDetails, RentedPropertyDetails } from "@/types";

// Properties Data
let properties: Property[] = [
  {
    id: "prop1",
    name: "Sunset Villa",
    address: "123 Sunnyside Ave, DHA Phase 6, Lahore",
    imageUrl: "https://placehold.co/600x400.png?text=Sunset+Villa",
    propertyType: "House",
    plots: [
      { id: "p1", plotNumber: "101", buyerName: "John Doe", buyerContact: "555-1234", price: 15000000, x: 25, y: 30, size: "10 Marla", details: "Corner plot with park view" },
      { id: "p2", plotNumber: "102", buyerName: "Jane Smith", buyerContact: "555-5678", price: 12000000, x: 50, y: 60, size: "8 Marla", details: "Garden facing plot" },
    ],
    imageType: 'photo',
    isRented: true,
    tenantName: "Mike Wheeler",
    rentAmount: 75000,
    nextRentDueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(), // Next month's 1st
  },
  {
    id: "prop2",
    name: "Greenwood Heights Plot",
    address: "Plot 52, Block C, Bahria Town, Rawalpindi",
    imageUrl: "https://placehold.co/600x400.png?text=Greenwood+Plot",
    propertyType: "Residential Plot",
    plots: [],
    imageType: 'photo',
    isSoldOnInstallment: true,
    purchaseDate: new Date(2023, 0, 15).toISOString(),
    totalInstallmentPrice: 2500000,
  },
  {
    id: "prop3",
    name: "Lakeside Estate Apartment",
    address: "Apt 3B, Lakeside Towers, Clifton, Karachi",
    propertyType: "Apartment",
    plots: [],
    imageType: 'photo',
    isRented: true,
    tenantName: "Eleven Hopper",
    rentAmount: 50000,
    nextRentDueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(), // This month's 15th
  },
  {
    id: "pdf-property",
    name: "PDF Plan Property (File)",
    address: "File # 123, Sector F, Capital Smart City",
    imageUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imageType: 'pdf',
    propertyType: "File",
    plots: [],
  },
];

export const getProperties = (): Property[] => JSON.parse(JSON.stringify(properties));

export const getPropertyById = (id: string): Property | undefined => {
  return JSON.parse(JSON.stringify(properties.find(p => p.id === id)));
};

export const getPropertyByName = (name: string): Property | undefined => {
  return JSON.parse(JSON.stringify(properties.find(p => p.name.toLowerCase() === name.toLowerCase())));
};


export const addProperty = (propertyData: Omit<Property, 'id' | 'plots'> & { imageType?: 'photo' | 'pdf', plots?: any[] }): Property => {
  const newProperty: Property = {
    id: `prop-${Date.now()}`,
    name: propertyData.name,
    address: propertyData.address,
    imageUrl: propertyData.imageUrl,
    imageType: propertyData.imageType || 'photo',
    propertyType: propertyData.propertyType,
    plots: propertyData.plots || [],
    isSoldOnInstallment: propertyData.isSoldOnInstallment,
    purchaseDate: propertyData.purchaseDate,
    totalInstallmentPrice: propertyData.totalInstallmentPrice,
    isRented: propertyData.isRented,
    tenantName: propertyData.tenantName,
    rentAmount: propertyData.rentAmount,
    nextRentDueDate: propertyData.nextRentDueDate,
  };
  properties.push(newProperty);
  return JSON.parse(JSON.stringify(newProperty));
};

export const updateProperty = (id: string, updates: Partial<Property>): Property | null => {
  const index = properties.findIndex(p => p.id === id);
  if (index === -1) return null;
  properties[index] = { ...properties[index], ...updates };
  return JSON.parse(JSON.stringify(properties[index]));
};

export const deleteProperty = (id: string): boolean => {
    const initialLength = properties.length;
    properties = properties.filter(p => p.id !== id);
    return properties.length < initialLength;
};


// Employees Data
let employees: Employee[] = [
  {
    id: "emp1",
    name: "Alice Johnson",
    position: "HR Manager",
    email: "alice.j@example.com",
    hireDate: new Date(2022, 5, 10).toISOString(),
    avatarUrl: "https://placehold.co/100x100.png",
    department: "Human Resources"
  },
  {
    id: "emp2",
    name: "Bob Smith",
    position: "Lead Developer",
    email: "bob.s@example.com",
    hireDate: new Date(2021, 2, 15).toISOString(),
    avatarUrl: "https://placehold.co/100x100.png",
    department: "Technology"
  },
  {
    id: "emp3",
    name: "Carol White",
    position: "Sales Executive",
    email: "carol.w@example.com",
    hireDate: new Date(2023, 0, 20).toISOString(),
    department: "Sales"
  },
];

export const getEmployees = (): Employee[] => JSON.parse(JSON.stringify(employees));

export const addEmployee = (employeeData: Omit<Employee, 'id'>): Employee => {
  const newEmployee: Employee = {
    id: `emp-${Date.now()}`,
    ...employeeData,
  };
  employees.push(newEmployee);
  return JSON.parse(JSON.stringify(newEmployee));
};

// Payments Data
let payments: PaymentRecord[] = [
  { id: "pay1", propertyId: "prop1", propertyName: "Sunset Villa", plotNumber: "101", tenantOrBuyerName: "Mike Wheeler", amount: 75000, date: new Date(new Date().getFullYear(), new Date().getMonth() -1, 1).toISOString(), type: "rent", paymentMethod: "Bank Transfer" },
  { id: "pay2", propertyId: "prop2", propertyName: "Greenwood Heights Plot", tenantOrBuyerName: "Alice Wonderland", amount: 500000, date: new Date(2023,11,1).toISOString(), type: "installment", paymentMethod: "Card", notes: "Down payment for plot" },
  { id: "pay3", propertyId: "prop3", propertyName: "Lakeside Estate Apartment", tenantOrBuyerName: "Eleven Hopper", amount: 50000, date: new Date(new Date().getFullYear(), new Date().getMonth() -1, 15).toISOString(), type: "rent", paymentMethod: "Cash" },
  { id: "pay4", propertyId: "prop1", propertyName: "Sunset Villa", plotNumber: "101", tenantOrBuyerName: "John Doe", amount: 1000000, date: new Date(2023, 10, 5).toISOString(), type: "token", paymentMethod: "Cheque", notes: "Token money for Plot 101" },
];

export const getPayments = (): PaymentRecord[] => JSON.parse(JSON.stringify(payments));

export const addPayment = (paymentData: Omit<PaymentRecord, 'id' | 'propertyName'> & { propertyName?: string }): PaymentRecord => {
    const property = getPropertyById(paymentData.propertyId);
    const newPayment: PaymentRecord = {
        id: `payment-${Date.now()}`,
        ...paymentData,
        propertyName: property ? property.name : "N/A",
        tenantOrBuyerName: paymentData.tenantOrBuyerName || (property?.isRented && property.tenantName ? property.tenantName : "N/A"),
    };
    payments.push(newPayment);

    if (newPayment.type === 'installment' && property?.isSoldOnInstallment) {
        const relatedInstallmentPayments = payments.filter(pay => pay.propertyId === property.id && pay.type === 'installment');
        const paidAmount = relatedInstallmentPayments.reduce((sum, pay) => sum + pay.amount, 0);
        if (paidAmount >= (property.totalInstallmentPrice || 0)) {
            // Mark as fully paid
        }
    }
    return JSON.parse(JSON.stringify(newPayment));
};

export const updatePayment = (id: string, updates: Partial<PaymentRecord>): PaymentRecord | null => {
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return null;
    const propertyName = updates.propertyId ? (getPropertyById(updates.propertyId)?.name || "N/A") : payments[index].propertyName;
    payments[index] = { ...payments[index], ...updates, propertyName };
    return JSON.parse(JSON.stringify(payments[index]));
}

export const deletePayment = (id: string): boolean => {
    const initialLength = payments.length;
    payments = payments.filter(p => p.id !== id);
    return payments.length < initialLength;
}


export const getInstallmentProperties = (): InstallmentDetails[] => {
  return properties
    .filter(p => p.isSoldOnInstallment)
    .map(p => {
      const relatedPayments = payments.filter(pay => pay.propertyId === p.id && pay.type === 'installment');
      const paidAmount = relatedPayments.reduce((sum, pay) => sum + pay.amount, 0);
      const remainingAmount = (p.totalInstallmentPrice || 0) - paidAmount;
      
      let nextDueDate: string | undefined = undefined;
      if (remainingAmount > 0) {
        const lastPaymentDate = relatedPayments.length > 0
            ? new Date(relatedPayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date)
            : new Date(p.purchaseDate || Date.now());
        nextDueDate = new Date(lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 1)).toISOString();
      }

      return {
        ...p,
        paidAmount,
        remainingAmount,
        nextDueDate,
      };
    });
};

export const getRentedProperties = (): RentedPropertyDetails[] => {
  return properties
    .filter(p => p.isRented)
    .map(p => {
      const relatedRentPayments = payments
        .filter(pay => pay.propertyId === p.id && pay.type === 'rent')
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const lastRentPaymentDate = relatedRentPayments.length > 0 ? relatedRentPayments[0].date : undefined;

      return {
        ...p,
        lastRentPaymentDate,
      };
    });
};


export const getAllMockProperties = () : Pick<Property, 'id' | 'name'>[] => {
    return properties.map(p => ({id: p.id, name: p.name}));
}

export const resetMockData = () => {
  properties = [
    {
      id: "prop1", name: "Sunset Villa", address: "123 Sunnyside Ave, DHA Phase 6, Lahore", propertyType: "House",
      plots: [
        { id: "p1", plotNumber: "101", buyerName: "John Doe", buyerContact: "555-1234", price: 15000000, x: 25, y: 30, size: "10 Marla", details: "Corner plot with park view" },
        { id: "p2", plotNumber: "102", buyerName: "Jane Smith", buyerContact: "555-5678", price: 12000000, x: 50, y: 60, size: "8 Marla", details: "Garden facing plot" },
      ],
      imageType: 'photo',
      isRented: true, tenantName: "Mike Wheeler", rentAmount: 75000, nextRentDueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    },
    {
      id: "prop2", name: "Greenwood Heights Plot", address: "Plot 52, Block C, Bahria Town, Rawalpindi", propertyType: "Residential Plot", plots: [], imageType: 'photo',
      isSoldOnInstallment: true, purchaseDate: new Date(2023, 0, 15).toISOString(), totalInstallmentPrice: 2500000,
    },
    {
      id: "prop3", name: "Lakeside Estate Apartment", address: "Apt 3B, Lakeside Towers, Clifton, Karachi", propertyType: "Apartment", plots: [], imageType: 'photo',
      isRented: true, tenantName: "Eleven Hopper", rentAmount: 50000, nextRentDueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(),
    },
    { id: "pdf-property", name: "PDF Plan Property (File)", address: "File # 123, Sector F, Capital Smart City", imageUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", imageType: 'pdf', propertyType: "File", plots: [] },
  ];
  employees = [
    { id: "emp1", name: "Alice Johnson", position: "HR Manager", email: "alice.j@example.com", hireDate: new Date(2022, 5, 10).toISOString(), avatarUrl: "https://placehold.co/100x100.png", department: "Human Resources" },
    { id: "emp2", name: "Bob Smith", position: "Lead Developer", email: "bob.s@example.com", hireDate: new Date(2021, 2, 15).toISOString(), avatarUrl: "https://placehold.co/100x100.png", department: "Technology" },
    { id: "emp3", name: "Carol White", position: "Sales Executive", email: "carol.w@example.com", hireDate: new Date(2023, 0, 20).toISOString(), department: "Sales" },
  ];
  payments = [
    { id: "pay1", propertyId: "prop1", propertyName: "Sunset Villa", plotNumber: "101", tenantOrBuyerName: "Mike Wheeler", amount: 75000, date: new Date(new Date().getFullYear(), new Date().getMonth() -1, 1).toISOString(), type: "rent", paymentMethod: "Bank Transfer" },
    { id: "pay2", propertyId: "prop2", propertyName: "Greenwood Heights Plot", tenantOrBuyerName: "Alice Wonderland", amount: 500000, date: new Date(2023,11,1).toISOString(), type: "installment", paymentMethod: "Card", notes: "Down payment for plot" },
    { id: "pay3", propertyId: "prop3", propertyName: "Lakeside Estate Apartment", tenantOrBuyerName: "Eleven Hopper", amount: 50000, date: new Date(new Date().getFullYear(), new Date().getMonth() -1, 15).toISOString(), type: "rent", paymentMethod: "Cash" },
    { id: "pay4", propertyId: "prop1", propertyName: "Sunset Villa", plotNumber: "101", tenantOrBuyerName: "John Doe", amount: 1000000, date: new Date(2023, 10, 5).toISOString(), type: "token", paymentMethod: "Cheque", notes: "Token money for Plot 101" },
  ];
};
