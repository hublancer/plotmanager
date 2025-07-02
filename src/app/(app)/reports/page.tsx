
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { generateSalesReport, type GenerateSalesReportInput, type GenerateSalesReportOutput } from "@/ai/flows/generate-sales-report";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";

const reportFormSchema = z.object({
  reportType: z.enum(["summary", "detailed"]),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function ReportsPage() {
  const [reportOutput, setReportOutput] = useState<GenerateSalesReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportType: "summary",
    },
  });

  const onSubmit = async (values: ReportFormValues) => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to generate a report.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    setReportOutput(null);
    try {
      // Input for the flow now only contains reportType
      const input: GenerateSalesReportInput = {
        reportType: values.reportType,
        userId: user.uid,
      };
      const result = await generateSalesReport(input); // The flow itself will fetch and process data
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
            Select the type of report you want the AI to generate. The system will use current property and sales data.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
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
