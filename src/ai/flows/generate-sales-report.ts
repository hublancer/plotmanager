
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

  // Process properties sold on installment or outright
  allProperties.forEach(prop => {
    if (prop.isSoldOnInstallment && prop.totalInstallmentPrice) {
      salesDetails.push({
        propertyName: prop.name,
        address: prop.address,
        buyerName: prop.buyerName || "N/A",
        price: prop.totalInstallmentPrice,
        date: prop.purchaseDate || new Date().toISOString(),
        saleType: "Installment Sale",
      });
    } else if (prop.isSold && prop.salePrice) {
      salesDetails.push({
        propertyName: prop.name,
        address: prop.address,
        buyerName: "N/A", // Not stored on property for outright sale
        price: prop.salePrice,
        date: prop.saleDate || new Date().toISOString(),
        saleType: "Outright Sale",
      });
    }

    // Process individual plots that are sold
    prop.plots?.forEach(plot => {
      if (plot.status === 'sold' && plot.saleDetails) {
         salesDetails.push({
          propertyName: prop.name,
          address: prop.address,
          buyerName: plot.saleDetails.buyerName || "N/A",
          price: plot.saleDetails.price,
          date: plot.saleDetails.date,
          saleType: "Plot Sale",
          plotNumber: plot.plotNumber,
        });
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

  // Process sales from transaction records, avoiding duplicates
  allTransactions.forEach(transaction => {
    if (transaction.type === 'income' && transaction.category === 'sale') {
      const alreadyProcessed = salesDetails.some(
        s => s.plotNumber === transaction.plotNumber && s.propertyName === transaction.propertyName
      );

      if (!alreadyProcessed) {
        const property = allProperties.find(p => p.id === transaction.propertyId);
        salesDetails.push({
          propertyName: transaction.propertyName || (property?.name || "N/A"),
          address: property?.address || "N/A",
          buyerName: transaction.contactName,
          price: transaction.amount,
          date: transaction.date,
          saleType: "Outright Sale (from transactions)",
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
