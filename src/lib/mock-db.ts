
import type { Property, Employee, PaymentRecord, InstallmentDetails } from "@/types";

// Properties Data
let properties: Property[] = [
  { id: "prop1", name: "Sunset Villa", address: "123 Sunnyside Ave", imageUrl: "https://placehold.co/600x400.png?text=Sunset+Villa", plots: [
    { id: "p1", plotNumber: "101", buyerName: "John Doe", buyerContact: "555-1234", price: 150000, x: 25, y: 30, details: "Corner plot with sea view" },
    { id: "p2", plotNumber: "102", buyerName: "Jane Smith", buyerContact: "555-5678", price: 120000, x: 50, y: 60, details: "Garden facing plot" },
  ], imageType: 'photo' },
  { id: "prop2", name: "Greenwood Heights", address: "456 Forest Ln", imageUrl: "https://placehold.co/600x400.png?text=Greenwood+Heights", plots: [], imageType: 'photo', isSoldOnInstallment: true, purchaseDate: new Date(2023, 0, 15).toISOString(), totalInstallmentPrice: 250000 },
  { id: "prop3", name: "Lakeside Estate", address: "789 Lake Rd", plots: [], imageType: 'photo' },
  { 
    id: "pdf-property", 
    name: "PDF Plan Property", 
    address: "789 Document Way", 
    imageUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", 
    imageType: 'pdf',
    plots: [] 
  },
];

export const getProperties = (): Property[] => JSON.parse(JSON.stringify(properties)); // Return a copy

export const getPropertyById = (id: string): Property | undefined => {
  return properties.find(p => p.id === id);
};

export const addProperty = (propertyData: Omit<Property, 'id' | 'plots' | 'imageType'> & { imageType?: 'photo' | 'pdf', plots?: any[] }): Property => {
  const newProperty: Property = {
    id: `prop-${Date.now()}`,
    name: propertyData.name,
    address: propertyData.address,
    imageUrl: propertyData.imageUrl,
    imageType: propertyData.imageType || 'photo',
    plots: propertyData.plots || [],
    isSoldOnInstallment: propertyData.isSoldOnInstallment,
    purchaseDate: propertyData.purchaseDate,
    totalInstallmentPrice: propertyData.totalInstallmentPrice,
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
  { id: "pay1", propertyId: "prop1", propertyName: "Sunset Villa", plotNumber: "101", tenantOrBuyerName: "John Doe", amount: 1200, date: new Date(2023,10,15).toISOString(), type: "rent", paymentMethod: "Bank Transfer" },
  { id: "pay2", propertyId: "prop2", propertyName: "Greenwood Heights", tenantOrBuyerName: "Alice Wonderland", amount: 5000, date: new Date(2023,11,1).toISOString(), type: "installment", paymentMethod: "Card" },
];

export const getPayments = (): PaymentRecord[] => JSON.parse(JSON.stringify(payments));

export const addPayment = (paymentData: Omit<PaymentRecord, 'id' | 'propertyName'> & { propertyName?: string }): PaymentRecord => {
    const property = getPropertyById(paymentData.propertyId);
    const newPayment: PaymentRecord = {
        id: `payment-${Date.now()}`,
        ...paymentData,
        propertyName: property ? property.name : "N/A",
    };
    payments.push(newPayment);
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


// Installment Properties Data - derived and managed based on properties and payments
export const getInstallmentProperties = (): InstallmentDetails[] => {
  return properties
    .filter(p => p.isSoldOnInstallment)
    .map(p => {
      const relatedPayments = payments.filter(pay => pay.propertyId === p.id && pay.type === 'installment');
      const paidAmount = relatedPayments.reduce((sum, pay) => sum + pay.amount, 0);
      const remainingAmount = (p.totalInstallmentPrice || 0) - paidAmount;
      
      // Simplified next due date logic for mock
      let nextDueDate: string | undefined = undefined;
      if (remainingAmount > 0) {
        const lastPaymentDate = relatedPayments.length > 0 ? new Date(relatedPayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date) : new Date(p.purchaseDate || Date.now());
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

export const getAllMockProperties = () : Pick<Property, 'id' | 'name'>[] => {
    return properties.map(p => ({id: p.id, name: p.name}));
}

// Reset all mock data (useful for testing or specific scenarios)
export const resetMockData = () => {
  properties = [
    { id: "prop1", name: "Sunset Villa", address: "123 Sunnyside Ave", imageUrl: "https://placehold.co/600x400.png?text=Sunset+Villa", plots: [
        { id: "p1", plotNumber: "101", buyerName: "John Doe", buyerContact: "555-1234", price: 150000, x: 25, y: 30, details: "Corner plot with sea view" },
        { id: "p2", plotNumber: "102", buyerName: "Jane Smith", buyerContact: "555-5678", price: 120000, x: 50, y: 60, details: "Garden facing plot" },
    ], imageType: 'photo' },
    { id: "prop2", name: "Greenwood Heights", address: "456 Forest Ln", imageUrl: "https://placehold.co/600x400.png?text=Greenwood+Heights", plots: [], imageType: 'photo', isSoldOnInstallment: true, purchaseDate: new Date(2023, 0, 15).toISOString(), totalInstallmentPrice: 250000 },
    { id: "prop3", name: "Lakeside Estate", address: "789 Lake Rd", plots: [], imageType: 'photo' },
    { id: "pdf-property", name: "PDF Plan Property", address: "789 Document Way", imageUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", imageType: 'pdf', plots: [] },
  ];
  employees = [
    { id: "emp1", name: "Alice Johnson", position: "HR Manager", email: "alice.j@example.com", hireDate: new Date(2022, 5, 10).toISOString(), avatarUrl: "https://placehold.co/100x100.png", department: "Human Resources" },
    { id: "emp2", name: "Bob Smith", position: "Lead Developer", email: "bob.s@example.com", hireDate: new Date(2021, 2, 15).toISOString(), avatarUrl: "https://placehold.co/100x100.png", department: "Technology" },
    { id: "emp3", name: "Carol White", position: "Sales Executive", email: "carol.w@example.com", hireDate: new Date(2023, 0, 20).toISOString(), department: "Sales" },
  ];
  payments = [
    { id: "pay1", propertyId: "prop1", propertyName: "Sunset Villa", plotNumber: "101", tenantOrBuyerName: "John Doe", amount: 1200, date: new Date(2023,10,15).toISOString(), type: "rent", paymentMethod: "Bank Transfer" },
    { id: "pay2", propertyId: "prop2", propertyName: "Greenwood Heights", tenantOrBuyerName: "Alice Wonderland", amount: 5000, date: new Date(2023,11,1).toISOString(), type: "installment", paymentMethod: "Card" },
  ];
};
