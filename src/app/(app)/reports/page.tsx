"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { generateSalesReport, type GenerateSalesReportInput, type GenerateSalesReportOutput } from "@/ai/flows/generate-sales-report";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const reportFormSchema = z.object({
  salesData: z.string().min(50, "Sales data must be at least 50 characters."),
  reportType: z.enum(["summary", "detailed"]),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

const sampleSalesData = `
Property: Sunset Villa, Plot: 101, Buyer: John Doe, Price: $150,000, Date: 2023-10-15
Property: Sunset Villa, Plot: 102, Buyer: Jane Smith, Price: $120,000, Date: 2023-11-01
Property: Greenwood Heights, Apt: B3, Buyer: Alice Wonderland, Price: $250,000 (Installment), Date: 2023-08-20
Property: Lakeside Estate, Plot: A5, Buyer: Bob Johnson, Price: $300,000, Date: 2023-12-05
`;

export default function ReportsPage() {
  const [reportOutput, setReportOutput] = useState<GenerateSalesReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      salesData: sampleSalesData.trim(),
      reportType: "summary",
    },
  });

  const onSubmit = async (values: ReportFormValues) => {
    setIsLoading(true);
    setReportOutput(null);
    try {
      const input: GenerateSalesReportInput = {
        salesData: values.salesData,
        reportType: values.reportType,
      };
      const result = await generateSalesReport(input);
      setReportOutput(result);
      toast({ title: "Report Generated", description: "AI sales report has been successfully created." });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error Generating Report",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">AI Sales Report Generator</CardTitle>
          <CardDescription>
            Compile sales data to produce insightful summaries or detailed reports using AI. 
            Paste your sales data below or use the sample.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="salesData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="salesData">Sales Data</FormLabel>
                    <FormControl>
                      <Textarea
                        id="salesData"
                        placeholder="Enter sales data here, e.g., Property Name, Plot #, Buyer, Price, Date..."
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide detailed sales records. More data leads to better reports.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="reportType">Report Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger id="reportType">
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="summary">Summary Report</SelectItem>
                          <SelectItem value="detailed">Detailed Report</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {isLoading && (
        <Card className="shadow-lg animate-pulse">
          <CardHeader><CardTitle>Generating Report...</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded w-full mt-4"></div>
          </CardContent>
        </Card>
      )}

      {reportOutput && !isLoading && (
        <Card className="shadow-xl transition-all duration-500 ease-out data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <CardHeader>
            <CardTitle>Generated Report</CardTitle>
            <CardDescription>
              AI-powered sales report ({form.getValues("reportType") === "summary" ? "Summary" : "Detailed"}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap bg-secondary/30 p-4 rounded-md text-sm font-mono leading-relaxed max-h-[500px] overflow-y-auto">
              {reportOutput.report}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
