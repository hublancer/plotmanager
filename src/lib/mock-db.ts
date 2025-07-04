
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
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { Property, Employee, Transaction, InstallmentDetails, Rental, Lead } from "@/types";

if (!db) {
  console.error("Firebase is not initialized. Database features will be disabled.");
}

const propertiesCollection = db ? collection(db, 'properties') : null;
const employeesCollection = db ? collection(db, 'employees') : null;
const transactionsCollection = db ? collection(db, 'transactions') : null;
const usersCollection = db ? collection(db, 'users') : null;
const leadsCollection = db ? collection(db, 'leads') : null;
const rentalsCollection = db ? collection(db, 'rentals') : null;


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
const mapDocToTransaction = (doc: any): Transaction => ({ id: doc.id, ...doc.data() } as Transaction);
const mapDocToLead = (doc: any): Lead => ({ id: doc.id, ...doc.data() } as Lead);
const mapDocToRental = (doc: any): Rental => ({ id: doc.id, ...doc.data() } as Rental);

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

export const getEmployeeByEmail = async (email: string): Promise<Employee | null> => {
    return safeDBOperation(async () => {
        const q = query(employeesCollection!, where("email", "==", email), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return mapDocToEmployee(snapshot.docs[0]);
        }
        return null;
    }, null);
};


export const addEmployee = async (employeeData: Omit<Employee, 'id' | 'status'>): Promise<Employee> => {
    return safeDBOperation(async () => {
        const dataToSave = { ...employeeData, status: 'pending' as const };
        const docRef = await addDoc(employeesCollection!, dataToSave);
        return { id: docRef.id, ...dataToSave };
    }, employeeData as Employee);
};

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee | null> => {
    return safeDBOperation(async () => {
        const docRef = doc(db!, 'employees', id);
        await updateDoc(docRef, updates);
        const updatedDoc = await getDoc(docRef);
        return updatedDoc.exists() ? mapDocToEmployee(updatedDoc) : null;
    }, null);
};

export const deleteEmployee = async (id: string): Promise<boolean> => {
    return safeDBOperation(async () => {
        await deleteDoc(doc(db!, 'employees', id));
        return true;
    }, false);
};


// ===== Transactions (replaces Payments) =====

export const getTransactions = async (userId: string, propertyId?: string): Promise<Transaction[]> => {
    return safeDBOperation(async () => {
        let q;
        // The query filters by userId and optionally propertyId. Sorting is handled client-side to avoid needing a composite index.
        if (propertyId) {
            q = query(transactionsCollection!, where("userId", "==", userId), where("propertyId", "==", propertyId));
        } else {
            q = query(transactionsCollection!, where("userId", "==", userId));
        }
        const snapshot = await getDocs(q);
        const transactions = snapshot.docs.map(mapDocToTransaction);
        // Sort transactions by date descending in the client
        return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, []);
};

export const getRecentTransactions = async (userId: string, count: number): Promise<Transaction[]> => {
  return safeDBOperation(async () => {
    // We cannot use limit() without orderBy(), so we fetch all, sort, and then limit.
    // This avoids needing a composite index.
    const q = query(transactionsCollection!, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(mapDocToTransaction);
    // Sort and then slice
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);
  }, []);
};

export const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'propertyName'>): Promise<Transaction> => {
    return safeDBOperation(async () => {
        let propertyName: string | undefined = undefined;
        if (transactionData.propertyId) {
            const property = await getPropertyById(transactionData.propertyId);
            propertyName = property ? property.name : "N/A";
        }
        
        const dataToSave = {
            ...transactionData,
            propertyName,
        };
        const docRef = await addDoc(transactionsCollection!, dataToSave);
        return { id: docRef.id, ...dataToSave };
    }, transactionData as Transaction);
};


export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction | null> => {
    return safeDBOperation(async () => {
        const docRef = doc(db!, 'transactions', id);
        let finalUpdates = { ...updates };
        if (updates.propertyId) {
            const property = await getPropertyById(updates.propertyId);
            finalUpdates.propertyName = property ? property.name : "N/A";
        }
        await updateDoc(docRef, finalUpdates);
        const updatedDoc = await getDoc(docRef);
        return updatedDoc.exists() ? mapDocToTransaction(updatedDoc) : null;
    }, null);
}

export const deleteTransaction = async (id: string): Promise<boolean> => {
    return safeDBOperation(async () => {
        await deleteDoc(doc(db!, 'transactions', id));
        return true;
    }, false);
};

// ===== Leads =====
export const getLeads = async (userId: string): Promise<Lead[]> => {
    return safeDBOperation(async () => {
        const q = query(leadsCollection!, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(mapDocToLead).sort((a,b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
    }, []);
};

export const addLead = async (leadData: Omit<Lead, 'id'>): Promise<Lead> => {
    return safeDBOperation(async () => {
        const docRef = await addDoc(leadsCollection!, { ...leadData, lastUpdate: new Date().toISOString() });
        return { id: docRef.id, ...leadData, lastUpdate: new Date().toISOString() };
    }, leadData as Lead);
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<Lead | null> => {
    return safeDBOperation(async () => {
        const docRef = doc(db!, 'leads', id);
        await updateDoc(docRef, { ...updates, lastUpdate: new Date().toISOString() });
        const updatedDoc = await getDoc(docRef);
        return updatedDoc.exists() ? mapDocToLead(updatedDoc) : null;
    }, null);
};

export const deleteLead = async (id: string): Promise<boolean> => {
    return safeDBOperation(async () => {
        await deleteDoc(doc(db!, 'leads', id));
        return true;
    }, false);
};

// ===== Rentals (New Standalone System) =====
export const getRentals = async (userId: string): Promise<Rental[]> => {
    return safeDBOperation(async () => {
        const q = query(rentalsCollection!, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(mapDocToRental);
    }, []);
};

export const addRental = async (rentalData: Omit<Rental, 'id'>): Promise<Rental> => {
    return safeDBOperation(async () => {
        const docRef = await addDoc(rentalsCollection!, rentalData);
        return { id: docRef.id, ...rentalData };
    }, rentalData as Rental);
};

export const updateRental = async (id: string, updates: Partial<Rental>): Promise<Rental | null> => {
    return safeDBOperation(async () => {
        const docRef = doc(db!, 'rentals', id);
        await updateDoc(docRef, updates);
        const updatedDoc = await getDoc(docRef);
        return updatedDoc.exists() ? mapDocToRental(updatedDoc) : null;
    }, null);
};

export const deleteRental = async (id: string): Promise<boolean> => {
    return safeDBOperation(async () => {
        await deleteDoc(doc(db!, 'rentals', id));
        return true;
    }, false);
};


// ===== Combined/Derived Data =====
export const getInstallmentProperties = async (userId: string): Promise<InstallmentDetails[]> => {
  return safeDBOperation(async () => {
    const propsQuery = query(propertiesCollection!, where("isSoldOnInstallment", "==", true), where("userId", "==", userId));
    const propertiesSnapshot = await getDocs(propsQuery);
    const installmentProperties = propertiesSnapshot.docs.map(mapDocToProperty);
    const allTransactions = await getTransactions(userId);

    return installmentProperties.map(p => {
        const relatedPayments = allTransactions.filter(t => t.propertyId === p.id && t.type === 'income' && t.category === 'installment');
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

export const getAllMockProperties = async (userId: string) : Promise<Pick<Property, 'id' | 'name'>[]> => {
    return safeDBOperation(async () => {
        const q = query(propertiesCollection!, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({id: doc.id, name: doc.data().name as string}));
    }, []);
}
