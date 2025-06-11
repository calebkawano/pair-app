'use client';

import { Badge } from "@/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/tooltip";

interface Member {
  id: string;
  full_name: string;
  dietary_preferences?: {
    notes: string;
  };
  allergies?: string[];
}

interface DietaryLabelsProps {
  item: {
    name: string;
    for_users?: string[];
    dietary_tags?: string[];
  };
  members: Member[];
}

export default function DietaryLabels({ item, members }: DietaryLabelsProps) {
  const assignedMembers = members.filter(member => 
    item.for_users?.includes(member.id)
  );

  const dietaryTags = item.dietary_tags || [];
  const hasWarnings = assignedMembers.some(member => 
    member.allergies?.some(allergy => 
      item.name.toLowerCase().includes(allergy.toLowerCase())
    )
  );

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Dietary Tags */}
      {dietaryTags.map((tag, index) => (
        <Badge key={index} variant="outline">
          {tag}
        </Badge>
      ))}

      {/* Member Assignments */}
      {assignedMembers.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="cursor-help">
                {assignedMembers.length} {assignedMembers.length === 1 ? 'member' : 'members'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-2">
                {assignedMembers.map(member => (
                  <div key={member.id} className="text-sm">
                    <span className="font-medium">{member.full_name}</span>
                    {member.dietary_preferences?.notes && (
                      <span className="text-muted-foreground"> - {member.dietary_preferences.notes}</span>
                    )}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Allergy Warnings */}
      {hasWarnings && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="cursor-help">
                ⚠️ Allergy Warning
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-2">
                {assignedMembers
                  .filter(member => 
                    member.allergies?.some(allergy => 
                      item.name.toLowerCase().includes(allergy.toLowerCase())
                    )
                  )
                  .map(member => (
                    <div key={member.id} className="text-sm">
                      <span className="font-medium">{member.full_name}</span>
                      <span className="text-muted-foreground"> is allergic to: </span>
                      <span>{member.allergies?.join(', ')}</span>
                    </div>
                  ))
                }
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
} 