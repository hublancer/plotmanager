// src/ai/flows/generate-sales-report.ts
'use server';

/**
 * @fileOverview Generates a sales report summary using AI.
 *
 * - generateSalesReport - A function that generates a sales report summary.
 * - GenerateSalesReportInput - The input type for the generateSalesReport function.
 * - GenerateSalesReportOutput - The return type for the generateSalesReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSalesReportInputSchema = z.object({
  salesData: z
    .string()
    .describe('Sales data, including property details, buyer information, and prices.'),
  reportType: z
    .enum(['summary', 'detailed'])
    .default('summary')
    .describe('Type of sales report to generate (summary or detailed).'),
});

export type GenerateSalesReportInput = z.infer<typeof GenerateSalesReportInputSchema>;

const GenerateSalesReportOutputSchema = z.object({
  report: z.string().describe('The generated sales report summary.'),
});

export type GenerateSalesReportOutput = z.infer<typeof GenerateSalesReportOutputSchema>;

export async function generateSalesReport(input: GenerateSalesReportInput): Promise<GenerateSalesReportOutput> {
  return generateSalesReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSalesReportPrompt',
  input: {schema: GenerateSalesReportInputSchema},
  output: {schema: GenerateSalesReportOutputSchema},
  prompt: `You are an AI assistant skilled in generating sales reports for property management.

      Based on the provided sales data, generate a sales report of the specified type.
      If the report type is summary, provide a high-level overview of sales trends and key insights.
      If the report type is detailed, provide a comprehensive report including property details, buyer information, and prices.

      Sales Data: {{{salesData}}}
      Report Type: {{{reportType}}}

      Report:
    `,
});

const generateSalesReportFlow = ai.defineFlow(
  {
    name: 'generateSalesReportFlow',
    inputSchema: GenerateSalesReportInputSchema,
    outputSchema: GenerateSalesReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
