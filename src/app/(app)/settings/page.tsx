
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const { toast } = useToast();

    return (
        <div className="space-y-6">
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>
                        Manage your account settings and preferences.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive updates about your properties.</p>
                        </div>
                        <Switch id="email-notifications" defaultChecked onCheckedChange={() => toast({ title: "Setting updated (demo only)"})}/>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                            <p className="text-sm text-muted-foreground">Toggle the application's theme.</p>
                        </div>
                        <Switch id="dark-mode" onCheckedChange={() => toast({ title: "Theme switching not implemented"})}/>
                    </div>
                    <div className="pt-4">
                        <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                        <div className="mt-2 flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                            <div>
                                <p className="font-medium">Delete Account</p>
                                <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                            </div>
                            <Button variant="destructive" onClick={() => alert("Account deletion is a critical action and is not enabled in this prototype.")}>Delete Account</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
