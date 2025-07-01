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

// ===== Properties =====

export const getProperties = async (): Promise<Property[]> => {
  return safeDBOperation(async () => {
    const snapshot = await getDocs(propertiesCollection!);
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

export const getPropertyByName = async (name: string): Promise<Property | undefined> => {
    return safeDBOperation(async () => {
        const q = query(propertiesCollection!, where("name", "==", name));
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

export const getEmployees = async (): Promise<Employee[]> => {
    return safeDBOperation(async () => {
        const snapshot = await getDocs(employeesCollection!);
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

export const getPayments = async (): Promise<PaymentRecord[]> => {
    return safeDBOperation(async () => {
        const snapshot = await getDocs(paymentsCollection!);
        return snapshot.docs.map(mapDocToPayment);
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
export const getInstallmentProperties = async (): Promise<InstallmentDetails[]> => {
  return safeDBOperation(async () => {
    const propsQuery = query(propertiesCollection!, where("isSoldOnInstallment", "==", true));
    const propertiesSnapshot = await getDocs(propsQuery);
    const installmentProperties = propertiesSnapshot.docs.map(mapDocToProperty);
    const allPayments = await getPayments();

    return installmentProperties.map(p => {
        const relatedPayments = allPayments.filter(pay => pay.propertyId === p.id && pay.type === 'installment');
        const paidAmount = relatedPayments.reduce((sum, pay) => sum + pay.amount, 0);
        const remainingAmount = (p.totalInstallmentPrice || 0) - paidAmount;
        
        let nextDueDate: string | undefined = undefined;
        if (remainingAmount > 0) {
            const paymentDates = relatedPayments.map(p => new Date(p.date).getTime());
            const purchaseDate = p.purchaseDate ? new Date(p.purchaseDate).getTime() : 0;
            const lastEventDate = new Date(Math.max(purchaseDate, ...paymentDates));
            nextDueDate = new Date(lastEventDate.setMonth(lastEventDate.getMonth() + 1)).toISOString();
        }

        return { ...p, paidAmount, remainingAmount, nextDueDate };
    });
  }, []);
};

export const getRentedProperties = async (): Promise<RentedPropertyDetails[]> => {
  return safeDBOperation(async () => {
    const propsQuery = query(propertiesCollection!, where("isRented", "==", true));
    const propertiesSnapshot = await getDocs(propsQuery);
    const rentedProperties = propertiesSnapshot.docs.map(mapDocToProperty);
    const allPayments = await getPayments();

    return rentedProperties.map(p => {
        const relatedRentPayments = allPayments
            .filter(pay => pay.propertyId === p.id && pay.type === 'rent')
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const lastRentPaymentDate = relatedRentPayments.length > 0 ? relatedRentPayments[0].date : undefined;
        return { ...p, lastRentPaymentDate };
    });
  }, []);
};

export const getAllMockProperties = async () : Promise<Pick<Property, 'id' | 'name'>[]> => {
    return safeDBOperation(async () => {
        const snapshot = await getDocs(propertiesCollection!);
        return snapshot.docs.map(doc => ({id: doc.id, name: doc.data().name as string}));
    }, []);
}
