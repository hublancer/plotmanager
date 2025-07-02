
"use client";

import type { Lead } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface LeadCardProps {
  lead: Lead;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (newStatus: Lead['status']) => void;
  onViewLocation: () => void;
  allStages: Lead['status'][];
}

export function LeadCard({ lead, onEdit, onDelete, onStatusChange, onViewLocation, allStages }: LeadCardProps) {
  const otherStages = allStages.filter(s => s !== lead.status);

  return (
    <Card className="shadow-sm hover:shadow-lg transition-shadow bg-card">
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{lead.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{lead.name}</p>
              <p className="text-xs text-muted-foreground truncate">{lead.company || "No company"}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit Lead</DropdownMenuItem>
              {lead.latitude && lead.longitude && (
                <DropdownMenuItem onClick={onViewLocation}>
                  <MapPin className="mr-2 h-4 w-4" />
                  View Location
                </DropdownMenuItem>
              )}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {otherStages.map(stage => (
                      <DropdownMenuItem key={stage} onClick={() => onStatusChange(stage)}>
                        {stage}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
        <div className="flex justify-between items-end">
           <p className="text-sm font-bold text-foreground">PKR {lead.value.toLocaleString()}</p>
           <p className="text-xs text-muted-foreground">
             {formatDistanceToNow(new Date(lead.lastUpdate), { addSuffix: true })}
           </p>
        </div>
      </CardContent>
    </Card>
  );
}
