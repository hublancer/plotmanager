
// src/ai/flows/generate-sales-report.ts
'use server';

/**
 * @fileOverview Generates a sales report summary using AI, based on data from the mock database.
 *
 * - generateSalesReport - A function that generates a sales report summary.
 * - GenerateSalesReportInput - The input type for the generateSalesReport function.
 * - GenerateSalesReportOutput - The return type for the generateSalesReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getProperties, getTransactions } from '@/lib/mock-db';
import type { Property, Transaction } from '@/types';

const GenerateSalesReportInputSchema = z.object({
  reportType: z
    .enum(['summary', 'detailed'])
    .default('summary')
    .describe('Type of sales report to generate (summary or detailed).'),
  userId: z.string().describe("The ID of the user requesting the report."),
});

export type GenerateSalesReportInput = z.infer<typeof GenerateSalesReportInputSchema>;

const GenerateSalesReportOutputSchema = z.object({
  report: z.string().describe('The generated sales report.'),
});

export type GenerateSalesReportOutput = z.infer<typeof GenerateSalesReportOutputSchema>;

const PromptInputSalesRecordSchema = z.object({
    propertyName: z.string(),
    address: z.string().optional(),
    buyerName: z.string().optional(),
    price: z.number(),
    date: z.string(), // ISO date string
    saleType: z.string().describe("e.g., 'Installment Sale', 'Outright Sale'"),
    plotNumber: z.string().optional(),
});

const PromptInputSchema = z.object({
  reportType: z.enum(['summary', 'detailed']),
  salesRecords: z.array(PromptInputSalesRecordSchema).describe("A list of sales transaction records."),
});


export async function generateSalesReport(input: GenerateSalesReportInput): Promise<GenerateSalesReportOutput> {
  const allProperties = await getProperties(input.userId);
  const allTransactions = await getTransactions(input.userId);
  const salesDetails: z.infer<typeof PromptInputSalesRecordSchema>[] = [];

  // Process properties sold on installment
  allProperties.forEach(prop => {
    if (prop.isSoldOnInstallment && prop.totalInstallmentPrice) {
      salesDetails.push({
        propertyName: prop.name,
        address: prop.address,
        buyerName: prop.buyerName || "N/A",
        price: prop.totalInstallmentPrice,
        date: prop.purchaseDate || new Date().toISOString(), // Fallback to current date if purchaseDate is missing
        saleType: "Installment Sale",
      });
    }
  });

  // Process outright sales from payment records
  allTransactions.forEach(transaction => {
    if (transaction.type === 'income' && transaction.category === 'sale') {
      // Avoid double-counting if this property was also marked isSoldOnInstallment
      // (though that would be a data inconsistency we want to guard against)
      const alreadyProcessedAsInstallment = salesDetails.some(
        s => s.propertyName === transaction.propertyName && s.saleType === "Installment Sale"
      );

      if (!alreadyProcessedAsInstallment) {
        const property = allProperties.find(p => p.id === transaction.propertyId);
        salesDetails.push({
          propertyName: transaction.propertyName || (property?.name || "N/A"),
          address: property?.address || "N/A",
          buyerName: transaction.contactName,
          price: transaction.amount,
          date: transaction.date,
          saleType: "Outright Sale",
          plotNumber: transaction.plotNumber,
        });
      }
    }
  });
  
  return generateSalesReportFlow({ reportType: input.reportType, salesRecords: salesDetails });
}

const prompt = ai.definePrompt({
  name: 'generateSalesReportPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: GenerateSalesReportOutputSchema},
  prompt: `You are an AI assistant skilled in generating sales reports for property management.

      Based on the provided sales records, generate a sales report of the specified type.
      If the report type is summary, provide a high-level overview of sales trends, total sales value, number of sales, and key insights.
      If the report type is detailed, provide a comprehensive report including property details, buyer information, prices, dates, and sale types for each transaction.

      Sales Records:
      {{#if salesRecords.length}}
      {{#each salesRecords}}
      - Property: {{this.propertyName}} ({{this.address}})
        {{#if this.plotNumber}}Plot: {{this.plotNumber}}{{/if}}
        Buyer: {{this.buyerName}}
        Price: PKR {{this.price}}
        Date: {{this.date}}
        Type: {{this.saleType}}
      {{/each}}
      {{else}}
      No sales records available to generate the report.
      {{/if}}

      Report Type: {{{reportType}}}

      Generated Report:
    `,
});

const generateSalesReportFlow = ai.defineFlow(
  {
    name: 'generateSalesReportFlow',
    inputSchema: PromptInputSchema, // Flow now takes the processed data
    outputSchema: GenerateSalesReportOutputSchema,
  },
  async (flowInput) => { // flowInput is { reportType, salesRecords }
    const {output} = await prompt(flowInput);
    return output!;
  }
);
