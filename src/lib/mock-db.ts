
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
  limit,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { Property, Employee, Transaction, InstallmentItem, RentalItem, PlotData, Lead, UserProfile, CalendarEvent } from "@/types";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, addMonths, addYears, isBefore } from 'date-fns';
import type { User } from 'firebase/auth';


if (!db) {
  console.error("Firebase is not initialized. Database features will be disabled.");
}

const propertiesCollection = db ? collection(db, 'properties') : null;
const employeesCollection = db ? collection(db, 'employees') : null;
const transactionsCollection = db ? collection(db, 'transactions') : null;
const usersCollection = db ? collection(db, 'users') : null;
const leadsCollection = db ? collection(db, 'leads') : null;
const eventsCollection = db ? collection(db, 'events') : null;


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
const mapDocToCalendarEvent = (doc: any): CalendarEvent => ({ id: doc.id, ...doc.data() } as CalendarEvent);

// ===== Users =====
export const getUserProfileByUID = async (uid: string): Promise<UserProfile | null> => {
  return safeDBOperation(async () => {
    const docRef = doc(db!, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as UserProfile : null;
  }, null);
};

export const initializeUser = async (user: User, displayName?: string | null): Promise<UserProfile> => {
    const existingProfileSnap = await getDoc(doc(db!, "users", user.uid));
    if (existingProfileSnap.exists()) {
        return { uid: existingProfileSnap.id, ...existingProfileSnap.data() } as UserProfile;
    }

    // New user logic
    let finalRole: UserProfile['role'] = 'admin';
    let adminId: string | undefined = undefined;
    let activePlan = false;
    
    if (user.email) {
        const invitedEmployee = await getEmployeeByEmail(user.email);
        if (invitedEmployee && invitedEmployee.status === 'pending') {
            finalRole = invitedEmployee.role;
            adminId = invitedEmployee.userId;
            activePlan = true; // Employees of an agency have an active plan
            await updateEmployee(invitedEmployee.id, { status: 'active', authUid: user.uid });
        }
    }
    
    const userProfileData = {
        uid: user.uid,
        displayName: displayName || user.displayName || user.email?.split('@')[0] || 'New User',
        email: user.email,
        createdAt: new Date().toISOString(),
        photoURL: user.photoURL || null,
        activePlan: activePlan,
        role: finalRole,
        adminId: adminId || null,
    };

    await setDoc(doc(db!, "users", user.uid), userProfileData);
    return userProfileData as UserProfile;
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
    const properties = snapshot.docs.map(mapDocToProperty);
    // Sort by creation date, newest first
    return properties.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });
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

export const addProperty = async (propertyData: Omit<Property, 'id' | 'createdAt'>): Promise<Property> => {
    return safeDBOperation(async () => {
        const dataToSave = { ...propertyData, createdAt: new Date().toISOString() };
        const docRef = await addDoc(propertiesCollection!, dataToSave);
        const newProperty = { id: docRef.id, ...dataToSave };
        if (!newProperty.plots) {
          newProperty.plots = [];
        }
        return newProperty as Property;
    }, { ...propertyData, createdAt: new Date().toISOString() } as Property);
};

export const updateProperty = async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    return safeDBOperation(async () => {
        const docRef = doc(db!, 'properties', id);
        await updateDoc(docRef, cleanUpdates);
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
        const employees = snapshot.docs.map(mapDocToEmployee);
        return employees.sort((a,b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
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


export const addEmployee = async (employeeData: Omit<Employee, 'id' | 'status' | 'createdAt'>): Promise<Employee> => {
    return safeDBOperation(async () => {
        const dataToSave = { ...employeeData, status: 'pending' as const, createdAt: new Date().toISOString() };
        const docRef = await addDoc(employeesCollection!, dataToSave);
        return { id: docRef.id, ...dataToSave };
    }, { ...employeeData, status: 'pending', createdAt: new Date().toISOString() } as Employee);
};

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee | null> => {
    return safeDBOperation(async () => {
        const docRef = doc(db!, 'employees', id);
        await updateDoc(docRef, updates);
        const updatedDoc = await getDoc(docRef);
        return updatedDoc.exists() ? mapDocToEmployee(updatedDoc) : null;
    }, null);
};

export const deleteEmployee = async (employeeId: string): Promise<boolean> => {
    return safeDBOperation(async () => {
        const employeeDocRef = doc(db!, 'employees', employeeId);
        const employeeSnap = await getDoc(employeeDocRef);

        if (!employeeSnap.exists()) {
            console.warn(`Employee with ID ${employeeId} not found for deletion.`);
            return false; // Return false if employee doesn't exist
        }

        const employeeData = employeeSnap.data() as Employee;

        // If the employee has an associated auth account (i.e., they have registered and are 'active')
        if (employeeData.authUid) {
            const userProfileRef = doc(db!, 'users', employeeData.authUid);
            const userProfileSnap = await getDoc(userProfileRef);

            if (userProfileSnap.exists()) {
                 // Revert the user to be an admin of their own account, severing ties.
                await updateDoc(userProfileRef, {
                    role: 'admin',
                    adminId: null,
                    activePlan: false // They'll need their own plan now.
                });
            }
        }

        // Finally, delete the employee record from the agency's list of employees.
        await deleteDoc(employeeDocRef);
        return true;
    }, false);
};


// ===== Transactions =====

export const getTransactions = async (userId: string, propertyId?: string, plotNumber?: string): Promise<Transaction[]> => {
    return safeDBOperation(async () => {
        let conditions = [where("userId", "==", userId)];
        if (propertyId) conditions.push(where("propertyId", "==", propertyId));
        if (plotNumber) conditions.push(where("plotNumber", "==", plotNumber));

        const q = query(transactionsCollection!, ...conditions);
        
        const snapshot = await getDocs(q);
        const transactions = snapshot.docs.map(mapDocToTransaction);
        return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, []);
};

export const getRecentTransactions = async (userId: string, count: number): Promise<Transaction[]> => {
  return safeDBOperation(async () => {
    const q = query(transactionsCollection!, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(mapDocToTransaction);
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);
  }, []);
};

export const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'propertyName'>): Promise<Transaction> => {
    return safeDBOperation(async () => {
        let propertyName = "N/A";
        if(transactionData.propertyId) {
            const prop = await getPropertyById(transactionData.propertyId);
            if(prop) propertyName = prop.name;
        }

        const dataToSave = { ...transactionData, propertyName };
        const docRef = await addDoc(transactionsCollection!, dataToSave);
        return { id: docRef.id, ...dataToSave };
    }, { ...transactionData, propertyName: "N/A" } as Transaction);
};


export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction | null> => {
    return safeDBOperation(async () => {
        const docRef = doc(db!, 'transactions', id);
        await updateDoc(docRef, updates);
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
        return { id: docRef.id, ...leadData, lastUpdate: new Date().toISOString() } as Lead;
    }, { ...leadData, id: '' } as Lead);
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

// ===== Schedule / Calendar Events =====
export const getCalendarEvents = async (userId: string): Promise<CalendarEvent[]> => {
    return safeDBOperation(async () => {
        const q = query(eventsCollection!, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const events = snapshot.docs.map(mapDocToCalendarEvent);
        return events.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, []);
};

export const addCalendarEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent> => {
    return safeDBOperation(async () => {
        const dataToSave = { ...eventData, createdAt: new Date().toISOString() };
        const docRef = await addDoc(eventsCollection!, dataToSave);
        return { id: docRef.id, ...dataToSave };
    }, { ...eventData, createdAt: new Date().toISOString() } as CalendarEvent);
};

export const updateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
    return safeDBOperation(async () => {
        const docRef = doc(db!, 'events', id);
        await updateDoc(docRef, updates);
        const updatedDoc = await getDoc(docRef);
        return updatedDoc.exists() ? mapDocToCalendarEvent(updatedDoc) : null;
    }, null);
};

export const deleteCalendarEvent = async (id: string): Promise<boolean> => {
    return safeDBOperation(async () => {
        await deleteDoc(doc(db!, 'events', id));
        return true;
    }, false);
};


// ===== DERIVED DATA FOR RENTALS & INSTALLMENTS =====

export const getDerivedRentals = async (userId: string): Promise<RentalItem[]> => {
    return safeDBOperation(async () => {
        const allProperties = await getProperties(userId);
        const allTransactions = await getTransactions(userId);
        const derivedRentals: RentalItem[] = [];

        const now = new Date();

        for (const prop of allProperties) {
            // Check for property-level rentals
            if (prop.isRented && prop.tenantName && prop.rentAmount && prop.rentFrequency && prop.rentStartDate) {
                const interval = rentalInterval(prop.rentFrequency);
                const hasPaid = allTransactions.some(t => 
                    t.propertyId === prop.id && !t.plotNumber && t.type === 'income' && t.category === 'rent' &&
                    isWithinInterval(new Date(t.date), interval)
                );
                const nextDueDate = calculateNextDueDate(new Date(prop.rentStartDate), prop.rentFrequency);

                derivedRentals.push({
                    id: prop.id,
                    source: 'property',
                    propertyId: prop.id,
                    propertyName: prop.name,
                    address: prop.address,
                    tenantName: prop.tenantName,
                    rentAmount: prop.rentAmount,
                    rentFrequency: prop.rentFrequency,
                    startDate: prop.rentStartDate,
                    paymentStatus: hasPaid ? 'Paid' : 'Due',
                    nextDueDate: nextDueDate.toISOString(),
                });
            }

            // Check for plot-level rentals
            if (prop.plots) {
                for (const plot of prop.plots) {
                    if (plot.status === 'rented' && plot.rentalDetails) {
                        const interval = rentalInterval(plot.rentalDetails.rentFrequency);
                        const hasPaid = allTransactions.some(t => 
                            t.propertyId === prop.id && t.plotNumber === plot.plotNumber && t.type === 'income' && t.category === 'rent' &&
                            isWithinInterval(new Date(t.date), interval)
                        );
                        const nextDueDate = calculateNextDueDate(new Date(plot.rentalDetails.startDate), plot.rentalDetails.rentFrequency);
                        derivedRentals.push({
                            id: plot.id,
                            source: 'plot',
                            propertyId: prop.id,
                            propertyName: prop.name,
                            plotNumber: plot.plotNumber,
                            address: prop.address,
                            tenantName: plot.rentalDetails.tenantName,
                            tenantContact: plot.rentalDetails.tenantContact,
                            rentAmount: plot.rentalDetails.rentAmount,
                            rentFrequency: plot.rentalDetails.rentFrequency,
                            startDate: plot.rentalDetails.startDate,
                            paymentStatus: hasPaid ? 'Paid' : 'Due',
                            nextDueDate: nextDueDate.toISOString(),
                        });
                    }
                }
            }
        }
        return derivedRentals.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, []);
};

export const endRental = async (propertyId: string, plotId?: string): Promise<boolean> => {
    return safeDBOperation(async () => {
        const prop = await getPropertyById(propertyId);
        if (!prop) return false;

        let updates: Partial<Property>;
        if (plotId) { // Ending a plot rental
            const newPlots = prop.plots.map(p => {
                if (p.id === plotId) {
                    return { ...p, status: 'available' as const, rentalDetails: undefined };
                }
                return p;
            });
            updates = { plots: newPlots };
        } else { // Ending a property-level rental
             updates = { isRented: false, tenantName: undefined, rentAmount: undefined, rentFrequency: undefined, rentStartDate: undefined };
        }
        
        await updateProperty(propertyId, updates);
        return true;
    }, false);
};

const rentalInterval = (freq: 'monthly' | 'yearly') => {
    const now = new Date();
    return freq === 'yearly' ? { start: startOfYear(now), end: endOfYear(now) } : { start: startOfMonth(now), end: endOfMonth(now) };
};

const calculateNextDueDate = (startDate: Date, frequency: 'monthly' | 'yearly'): Date => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let nextDueDate = new Date(startDate);
    nextDueDate.setHours(0, 0, 0, 0);

    if (frequency === 'monthly') {
        while (isBefore(nextDueDate, now)) {
            nextDueDate = addMonths(nextDueDate, 1);
        }
    } else { // yearly
         while (isBefore(nextDueDate, now)) {
            nextDueDate = addYears(nextDueDate, 1);
        }
    }
    return nextDueDate;
};

export const getDerivedInstallmentItems = async (userId: string): Promise<InstallmentItem[]> => {
    return safeDBOperation(async () => {
        const allProperties = await getProperties(userId);
        const allTransactions = await getTransactions(userId);
        const derivedItems: InstallmentItem[] = [];

        for (const prop of allProperties) {
            // Check property-level installments
            if (prop.isSoldOnInstallment && prop.totalInstallmentPrice && prop.purchaseDate) {
                derivedItems.push(calculateInstallmentItem(prop, allTransactions, 'property'));
            }

            // Check plot-level installments
            if (prop.plots) {
                for (const plot of prop.plots) {
                    if (plot.status === 'installment' && plot.installmentDetails) {
                        derivedItems.push(calculateInstallmentItem(prop, allTransactions, 'plot', plot));
                    }
                }
            }
        }
        
        return derivedItems.sort((a,b) => {
            if (a.status === 'Overdue' && b.status !== 'Overdue') return -1;
            if (a.status !== 'Overdue' && b.status === 'Overdue') return 1;
            if (a.status === 'Active' && b.status === 'Fully Paid') return -1;
            if (a.status === 'Fully Paid' && b.status === 'Active') return 1;
            return 0;
        });

    }, []);
};

export const endInstallmentPlan = async (propertyId: string, plotId?: string): Promise<boolean> => {
     return safeDBOperation(async () => {
        const prop = await getPropertyById(propertyId);
        if (!prop) return false;

        let updates: Partial<Property>;
        if (plotId) { // Ending a plot plan
            const newPlots = prop.plots.map(p => {
                if (p.id === plotId) {
                    return { ...p, status: 'available' as const, installmentDetails: undefined };
                }
                return p;
            });
            updates = { plots: newPlots };
        } else { // Ending a property-level plan
             updates = { isSoldOnInstallment: false, buyerName: undefined, buyerContact: undefined, totalInstallmentPrice: undefined, downPayment: undefined, installmentFrequency: undefined, installmentDuration: undefined, purchaseDate: undefined };
        }
        
        await updateProperty(propertyId, updates);
        return true;
    }, false);
};


function calculateInstallmentItem(prop: Property, transactions: Transaction[], source: 'property' | 'plot', plot?: PlotData): InstallmentItem {
    const details = source === 'plot' ? plot!.installmentDetails! : {
        totalPrice: prop.totalInstallmentPrice!,
        downPayment: prop.downPayment!,
        purchaseDate: prop.purchaseDate!,
        frequency: prop.installmentFrequency!,
        duration: prop.installmentDuration!,
        buyerName: prop.buyerName!,
        buyerContact: prop.buyerContact,
    };
    
    const relatedPayments = transactions.filter(t => 
        t.propertyId === prop.id && 
        t.type === 'income' && 
        t.category === 'installment' &&
        (source === 'plot' ? t.plotNumber === plot!.plotNumber : !t.plotNumber)
    );

    const downPayment = details.downPayment || 0;
    const paidInstallmentAmount = relatedPayments.reduce((sum, pay) => sum + pay.amount, 0);
    const paidAmount = downPayment + paidInstallmentAmount;
    const remainingAmount = details.totalPrice - paidAmount;
    
    const totalInstallments = details.duration || 0;
    const paidInstallments = relatedPayments.length;
    
    const principal = details.totalPrice - downPayment;
    const installmentAmount = totalInstallments > 0 ? principal / totalInstallments : 0;

    let nextDueDate: Date | undefined;
    if (details.purchaseDate && remainingAmount > 0.01) {
        const baseDate = new Date(details.purchaseDate);
        const intervalsPaid = paidInstallments + 1;
        if (details.frequency === 'yearly') {
            nextDueDate = addYears(baseDate, intervalsPaid);
        } else {
            nextDueDate = addMonths(baseDate, intervalsPaid);
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
        id: source === 'plot' ? plot!.id : prop.id,
        source,
        propertyId: prop.id,
        propertyName: prop.name,
        address: prop.address,
        plotNumber: plot?.plotNumber,
        buyerName: details.buyerName,
        buyerContact: details.buyerContact,
        totalInstallmentPrice: details.totalPrice,
        paidAmount,
        remainingAmount: remainingAmount < 0.01 ? 0 : remainingAmount,
        nextDueDate: nextDueDate?.toISOString(),
        status,
        paidInstallments,
        totalInstallments,
        installmentAmount,
    };
}


// ===== Misc =====

export const getAllMockProperties = async (userId: string) : Promise<Pick<Property, 'id' | 'name'>[]> => {
    return safeDBOperation(async () => {
        const q = query(propertiesCollection!, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({id: doc.id, name: doc.data().name as string}));
    }, []);
}
