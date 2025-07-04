
// src/ai/flows/generate-sales-report.ts
'use server';

/**
 * @fileOverview Generates comprehensive business reports using AI, based on data from the mock database.
 *
 * - generateSalesReport - A function that generates various business reports (Sales, Rentals, Installments).
 * - GenerateSalesReportInput - The input type for the generateSalesReport function.
 * - GenerateSalesReportOutput - The return type for the generateSalesReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getProperties, getTransactions, getDerivedRentals, getDerivedInstallmentItems } from '@/lib/mock-db';
import type { RentalItem, InstallmentItem } from '@/types';

// Input Schema for the main exported function
const GenerateSalesReportInputSchema = z.object({
  reportType: z
    .enum(['sales_summary', 'sales_detailed', 'rentals', 'installments'])
    .describe('Type of business report to generate.'),
  userId: z.string().describe("The ID of the user requesting the report."),
});
export type GenerateSalesReportInput = z.infer<typeof GenerateSalesReportInputSchema>;

// Output schema is generic, just a string report
const GenerateSalesReportOutputSchema = z.object({
  report: z.string().describe('The generated business report.'),
});
export type GenerateSalesReportOutput = z.infer<typeof GenerateSalesReportOutputSchema>;


// --- Schemas for prompt inputs ---

const SalesRecordSchema = z.object({
    propertyName: z.string(),
    address: z.string().optional(),
    buyerName: z.string().optional(),
    price: z.number(),
    date: z.string(), // ISO date string
    saleType: z.string().describe("e.g., 'Installment Sale', 'Outright Sale'"),
    plotNumber: z.string().optional(),
});

const RentalRecordSchema = z.object({
    propertyName: z.string(),
    plotNumber: z.string().optional(),
    tenantName: z.string(),
    rentAmount: z.number(),
    rentFrequency: z.string(),
    paymentStatus: z.string(),
});

const InstallmentRecordSchema = z.object({
    propertyName: z.string(),
    plotNumber: z.string().optional(),
    buyerName: z.string(),
    totalPrice: z.number(),
    paidAmount: z.number(),
    remainingAmount: z.number(),
    status: z.string(),
});

// Discriminated union for the prompt input
const PromptInputSchema = z.discriminatedUnion("reportType", [
    z.object({
        reportType: z.literal("sales_summary"),
        salesRecords: z.array(SalesRecordSchema),
    }),
    z.object({
        reportType: z.literal("sales_detailed"),
        salesRecords: z.array(SalesRecordSchema),
    }),
    z.object({
        reportType: z.literal("rentals"),
        rentalRecords: z.array(RentalRecordSchema),
    }),
    z.object({
        reportType: z.literal("installments"),
        installmentRecords: z.array(InstallmentRecordSchema),
    }),
]);
type PromptInput = z.infer<typeof PromptInputSchema>;


export async function generateSalesReport(input: GenerateSalesReportInput): Promise<GenerateSalesReportOutput> {
  const allProperties = await getProperties(input.userId);
  const allPropertiesMap = new Map(allProperties.map(p => [p.id, p]));

  let flowInput: PromptInput;

  switch (input.reportType) {
    case 'sales_summary':
    case 'sales_detailed': {
      const salesDetails: z.infer<typeof SalesRecordSchema>[] = [];
      const allTransactions = await getTransactions(input.userId);

      // 1. Process all 'sale' transactions first, as they are the most direct record of a sale.
      allTransactions.forEach(transaction => {
        if (transaction.type === 'income' && transaction.category === 'sale') {
          const propertyName = transaction.propertyName || allPropertiesMap.get(transaction.propertyId!)?.name || 'Unknown Property';
          const propertyAddress = allPropertiesMap.get(transaction.propertyId!)?.address || 'N/A';
          salesDetails.push({
            propertyName: propertyName,
            address: propertyAddress,
            buyerName: transaction.contactName || "N/A",
            price: transaction.amount,
            date: transaction.date,
            saleType: "Outright Sale (from transaction)",
            plotNumber: transaction.plotNumber,
          });
        }
      });
      
      // 2. Process properties and plots marked as sold/installment, ensuring no double counting from transactions.
      allProperties.forEach(prop => {
        // Property-level installment sale
        if (prop.isSoldOnInstallment && prop.totalInstallmentPrice) {
            salesDetails.push({
                propertyName: prop.name,
                address: prop.address,
                buyerName: prop.buyerName || "N/A",
                price: prop.totalInstallmentPrice,
                date: prop.purchaseDate || new Date().toISOString(),
                saleType: "Installment Sale (Property)",
            });
        }
        // Plot-level sales
        prop.plots?.forEach(plot => {
            if (plot.status === 'sold' && plot.saleDetails) {
                const saleAlreadyRecorded = allTransactions.some(t => t.propertyId === prop.id && t.plotNumber === plot.plotNumber && t.category === 'sale');
                if (!saleAlreadyRecorded) {
                    salesDetails.push({
                        propertyName: prop.name,
                        address: prop.address,
                        buyerName: plot.saleDetails.buyerName || "N/A",
                        price: plot.saleDetails.price,
                        date: plot.saleDetails.date,
                        saleType: "Plot Sale",
                        plotNumber: plot.plotNumber,
                    });
                }
            } else if (plot.status === 'installment' && plot.installmentDetails) {
                 salesDetails.push({
                    propertyName: prop.name,
                    address: prop.address,
                    buyerName: plot.installmentDetails.buyerName || "N/A",
                    price: plot.installmentDetails.totalPrice,
                    date: plot.installmentDetails.purchaseDate,
                    saleType: "Plot Installment Sale",
                    plotNumber: plot.plotNumber,
                });
            }
        });
      });

      // Remove duplicates based on a composite key to ensure data integrity
      const uniqueSalesDetails = Array.from(new Map(salesDetails.map(item =>
        [`${item.propertyName}-${item.plotNumber || ''}-${item.price}-${item.date}`, item]
      )).values());

      flowInput = { reportType: input.reportType, salesRecords: uniqueSalesDetails };
      break;
    }

    case 'rentals': {
      const rentalData = await getDerivedRentals(input.userId);
      const rentalRecords = rentalData.map(r => ({
          propertyName: r.propertyName,
          plotNumber: r.plotNumber,
          tenantName: r.tenantName,
          rentAmount: r.rentAmount,
          rentFrequency: r.rentFrequency,
          paymentStatus: r.paymentStatus,
      }));
      flowInput = { reportType: 'rentals', rentalRecords };
      break;
    }

    case 'installments': {
      const installmentData = await getDerivedInstallmentItems(input.userId);
      const installmentRecords = installmentData.map(i => ({
        propertyName: i.propertyName,
        plotNumber: i.plotNumber,
        buyerName: i.buyerName,
        totalPrice: i.totalInstallmentPrice,
        paidAmount: i.paidAmount,
        remainingAmount: i.remainingAmount,
        status: i.status,
      }));
      flowInput = { reportType: 'installments', installmentRecords };
      break;
    }

    default:
      // This should not be reached due to Zod validation, but as a safeguard:
      return { report: "Invalid report type specified." };
  }
  
  return generateSalesReportFlow(flowInput);
}

const prompt = ai.definePrompt({
  name: 'generateSalesReportPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: GenerateSalesReportOutputSchema},
  prompt: `You are an AI assistant skilled in generating business reports for property management. 
      Analyze the provided data and generate a clear, professional report of the specified type.
      The currency is PKR. Format numbers with commas. Start with a brief, insightful summary.

      {{#if (eq reportType "sales_summary")}}
      Generate a high-level summary of sales. Cover total sales value, number of sales, average sale price, and identify any key insights or trends from the data.
      Data:
      {{#if salesRecords.length}}
      {{#each salesRecords}}
      - Property: {{this.propertyName}}, Price: {{this.price}}, Date: {{this.date}}, Type: {{this.saleType}}
      {{/each}}
      {{else}}
      No sales records available.
      {{/if}}
      {{/if}}

      {{#if (eq reportType "sales_detailed")}}
      Generate a detailed sales report. List each transaction with property details, buyer information, price, date, and sale type. Provide a total summary at the end.
      Data:
      {{#if salesRecords.length}}
      {{#each salesRecords}}
      - Property: {{this.propertyName}} {{#if this.address}}({{this.address}}){{/if}}
        {{#if this.plotNumber}}Plot: {{this.plotNumber}}{{/if}}
        Buyer: {{this.buyerName}}
        Price: PKR {{this.price}}
        Date: {{this.date}}
        Type: {{this.saleType}}
      
      {{/each}}
      {{else}}
      No sales records available.
      {{/if}}
      {{/if}}

      {{#if (eq reportType "rentals")}}
      Generate a rentals report. Summarize the rental portfolio, including total potential rent, occupancy rate (number of rented units), and a list of properties with their current payment status.
      Data:
      {{#if rentalRecords.length}}
      {{#each rentalRecords}}
      - Property: {{this.propertyName}} {{#if this.plotNumber}}(Plot {{this.plotNumber}}){{/if}}
        Tenant: {{this.tenantName}}
        Rent: PKR {{this.rentAmount}}/{{this.rentFrequency}}
        Status: {{this.paymentStatus}}
      {{/each}}
      {{else}}
      No rental records available.
      {{/if}}
      {{/if}}

      {{#if (eq reportType "installments")}}
      Generate an installment plans report. Summarize the active plans, including total value of properties on installment, total amount paid vs. remaining, and highlight any overdue accounts.
      Data:
      {{#if installmentRecords.length}}
      {{#each installmentRecords}}
      - Property: {{this.propertyName}} {{#if this.plotNumber}}(Plot {{this.plotNumber}}){{/if}}
        Buyer: {{this.buyerName}}
        Total Price: PKR {{this.totalPrice}}
        Paid: PKR {{this.paidAmount}} (Remaining: PKR {{this.remainingAmount}})
        Status: {{this.status}}
      {{/each}}
      {{else}}
      No installment records available.
      {{/if}}
      {{/if}}

      Generated Report:
    `,
});

const generateSalesReportFlow = ai.defineFlow(
  {
    name: 'generateSalesReportFlow',
    inputSchema: PromptInputSchema,
    outputSchema: GenerateSalesReportOutputSchema,
  },
  async (flowInput) => {
    const {output} = await prompt(flowInput);
    return output!;
  }
);
