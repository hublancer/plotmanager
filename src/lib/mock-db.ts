
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Property, Employee, PaymentRecord, InstallmentDetails, RentedPropertyDetails } from "@/types";

if (!db) {
  console.error("Firebase is not initialized. Database features will be disabled.");
}

const propertiesCollection = db ? collection(db, 'properties') : null;
const employeesCollection = db ? collection(db, 'employees') : null;
const paymentsCollection = db ? collection(db, 'payments') : null;
const usersCollection = db ? collection(db, 'users') : null;


// Helper to safely execute DB operations
async function safeDBOperation<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  if (!db) {
    return fallback;
  }
  try {
    return await operation();
  } catch (error) {
    console.error("Firestore operation failed:", error);
    return fallback;
  }
}

// Helper functions to convert Firestore doc to our types
const mapDocToProperty = (doc: any): Property => ({ id: doc.id, ...doc.data() } as Property);
const mapDocToEmployee = (doc: any): Employee => ({ id: doc.id, ...doc.data() } as Employee);
const mapDocToPayment = (doc: any): PaymentRecord => ({ id: doc.id, ...doc.data() } as PaymentRecord);

// ===== Users =====
export const getUserProfileByUID = async (uid: string): Promise<any | null> => {
  return safeDBOperation(async () => {
    const docRef = doc(db!, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }, null);
};

export const updateUser = async (uid: string, updates: any): Promise<boolean> => {
    return safeDBOperation(async () => {
        const docRef = doc(db!, 'users', uid);
        await updateDoc(docRef, updates);
        return true;
    }, false);
};

// ===== Properties =====

export const getProperties = async (userId: string): Promise<Property[]> => {
  return safeDBOperation(async () => {
    const q = query(propertiesCollection!, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToProperty);
  }, []);
};

export const getPropertyById = async (id: string): Promise<Property | undefined> => {
  return safeDBOperation(async () => {
    const docRef = doc(db!, 'properties', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? mapDocToProperty(docSnap) : undefined;
  }, undefined);
};

export const getPropertyByName = async (name: string, userId: string): Promise<Property | undefined> => {
    return safeDBOperation(async () => {
        const q = query(propertiesCollection!, where("name", "==", name), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return mapDocToProperty(snapshot.docs[0]);
        }
        return undefined;
    }, undefined);
};

export const addProperty = async (propertyData: Omit<Property, 'id'>): Promise<Property> => {
    return safeDBOperation(async () => {
        const docRef = await addDoc(propertiesCollection!, propertyData);
        const newProperty = { id: docRef.id, ...propertyData };
        // Ensure plots is not undefined
        if (!newProperty.plots) {
          newProperty.plots = [];
        }
        return newProperty;
    }, propertyData as Property); // Fallback is imperfect but better than null
};

export const updateProperty = async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    return safeDBOperation(async () => {
        const docRef = doc(db!, 'properties', id);
        await updateDoc(docRef, updates);
        const updatedDoc = await getDoc(docRef);
        return updatedDoc.exists() ? mapDocToProperty(updatedDoc) : null;
    }, null);
};

export const deleteProperty = async (id: string): Promise<boolean> => {
    return safeDBOperation(async () => {
        await deleteDoc(doc(db!, 'properties', id));
        return true;
    }, false);
};

// ===== Employees =====

export const getEmployees = async (userId: string): Promise<Employee[]> => {
    return safeDBOperation(async () => {
        const q = query(employeesCollection!, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(mapDocToEmployee);
    }, []);
};

export const addEmployee = async (employeeData: Omit<Employee, 'id'>): Promise<Employee> => {
    return safeDBOperation(async () => {
        const docRef = await addDoc(employeesCollection!, employeeData);
        return { id: docRef.id, ...employeeData };
    }, employeeData as Employee);
};

export const deleteEmployee = async (id: string): Promise<boolean> => {
    return safeDBOperation(async () => {
        await deleteDoc(doc(db!, 'employees', id));
        return true;
    }, false);
};


// ===== Payments =====

export const getPayments = async (userId: string, propertyId?: string): Promise<PaymentRecord[]> => {
    return safeDBOperation(async () => {
        let q;
        if (propertyId) {
            q = query(paymentsCollection!, where("userId", "==", userId), where("propertyId", "==", propertyId));
        } else {
            q = query(paymentsCollection!, where("userId", "==", userId));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(mapDocToPayment).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, []);
};

export const addPayment = async (paymentData: Omit<PaymentRecord, 'id' | 'propertyName'>): Promise<PaymentRecord> => {
    return safeDBOperation(async () => {
        const property = await getPropertyById(paymentData.propertyId);
        const dataToSave = {
            ...paymentData,
            propertyName: property ? property.name : "N/A",
            tenantOrBuyerName: paymentData.tenantOrBuyerName,
        };
        const docRef = await addDoc(paymentsCollection!, dataToSave);
        return { id: docRef.id, ...dataToSave };
    }, paymentData as PaymentRecord);
};

export const updatePayment = async (id: string, updates: Partial<PaymentRecord>): Promise<PaymentRecord | null> => {
    return safeDBOperation(async () => {
        const docRef = doc(db!, 'payments', id);
        let finalUpdates = { ...updates };
        if (updates.propertyId) {
            const property = await getPropertyById(updates.propertyId);
            finalUpdates.propertyName = property ? property.name : "N/A";
        }
        await updateDoc(docRef, finalUpdates);
        const updatedDoc = await getDoc(docRef);
        return updatedDoc.exists() ? mapDocToPayment(updatedDoc) : null;
    }, null);
}

export const deletePayment = async (id: string): Promise<boolean> => {
    return safeDBOperation(async () => {
        await deleteDoc(doc(db!, 'payments', id));
        return true;
    }, false);
};

// ===== Combined/Derived Data =====
export const getInstallmentProperties = async (userId: string): Promise<InstallmentDetails[]> => {
  return safeDBOperation(async () => {
    const propsQuery = query(propertiesCollection!, where("isSoldOnInstallment", "==", true), where("userId", "==", userId));
    const propertiesSnapshot = await getDocs(propsQuery);
    const installmentProperties = propertiesSnapshot.docs.map(mapDocToProperty);
    const allPayments = await getPayments(userId);

    return installmentProperties.map(p => {
        const relatedPayments = allPayments.filter(pay => pay.propertyId === p.id && pay.type === 'installment');
        const downPayment = p.downPayment || 0;
        const paidInstallmentAmount = relatedPayments.reduce((sum, pay) => sum + pay.amount, 0);
        const paidAmount = downPayment + paidInstallmentAmount;
        const remainingAmount = (p.totalInstallmentPrice || 0) - paidAmount;

        const totalInstallments = p.installmentDuration || 0;
        const paidInstallments = relatedPayments.length;
        
        const principal = (p.totalInstallmentPrice || 0) - downPayment;
        const installmentAmount = totalInstallments > 0 ? principal / totalInstallments : 0;

        let nextDueDate: Date | undefined;
        // Base date for next due is based on the purchase date and number of installments paid
        if (p.purchaseDate && remainingAmount > 0.01) {
            const baseDate = new Date(p.purchaseDate);
            const intervalsPaid = paidInstallments + 1; // The next interval to be paid
            if (p.installmentFrequency === 'yearly') {
                nextDueDate = new Date(new Date(baseDate).setFullYear(baseDate.getFullYear() + intervalsPaid));
            } else { // default monthly
                nextDueDate = new Date(new Date(baseDate).setMonth(baseDate.getMonth() + intervalsPaid));
            }
        }
      
        const today = new Date();
        today.setHours(0, 0, 0, 0);
      
        let status: 'Active' | 'Overdue' | 'Fully Paid' = 'Active';
        if (remainingAmount <= 0.01) {
            status = 'Fully Paid';
        } else if (nextDueDate && nextDueDate < today) {
            status = 'Overdue';
        }

        return { 
            ...p,
            paidAmount, 
            remainingAmount: remainingAmount < 0.01 ? 0 : remainingAmount,
            nextDueDate: nextDueDate?.toISOString(),
            status,
            paidInstallments,
            totalInstallments,
            installmentAmount,
        };
    }).sort((a,b) => { // Sort by status: Overdue -> Active -> Fully Paid
        if (a.status === 'Overdue' && b.status !== 'Overdue') return -1;
        if (a.status !== 'Overdue' && b.status === 'Overdue') return 1;
        if (a.status === 'Active' && b.status === 'Fully Paid') return -1;
        if (a.status === 'Fully Paid' && b.status === 'Active') return 1;
        return 0;
    });
  }, []);
};

export const getRentedProperties = async (userId: string): Promise<RentedPropertyDetails[]> => {
  return safeDBOperation(async () => {
    const propsQuery = query(propertiesCollection!, where("isRented", "==", true), where("userId", "==", userId));
    const propertiesSnapshot = await getDocs(propsQuery);
    const rentedProperties = propertiesSnapshot.docs.map(mapDocToProperty);
    const allPayments = await getPayments(userId);

    return rentedProperties.map(p => {
        const relatedRentPayments = allPayments
            .filter(pay => pay.propertyId === p.id && pay.type === 'rent')
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const lastRentPaymentDate = relatedRentPayments.length > 0 ? relatedRentPayments[0].date : undefined;

        let nextDueDate: Date | undefined;
        // Base date for calculation is the latest payment, or the start date if no payments exist.
        const baseDateSrc = lastRentPaymentDate ? lastRentPaymentDate : p.rentStartDate;
        
        if (baseDateSrc) {
            const baseDate = new Date(baseDateSrc);
            if (p.rentFrequency === 'yearly') {
                nextDueDate = new Date(new Date(baseDate).setFullYear(baseDate.getFullYear() + 1));
            } else { // default to monthly
                nextDueDate = new Date(new Date(baseDate).setMonth(baseDate.getMonth() + 1));
            }
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize for date-only comparison
        const status = (p.isRented && nextDueDate && nextDueDate < today) ? 'Overdue' : 'Active';

        return { 
            ...p, 
            lastRentPaymentDate, 
            nextRentDueDate: nextDueDate?.toISOString(),
            status
        };
    });
  }, []);
};

export const getAllMockProperties = async (userId: string) : Promise<Pick<Property, 'id' | 'name'>[]> => {
    return safeDBOperation(async () => {
        const q = query(propertiesCollection!, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({id: doc.id, name: doc.data().name as string}));
    }, []);
}
