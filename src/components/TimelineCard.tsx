import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TimelineItem {
  id: string;
  title: string;
  time?: string;
  status: 'completed' | 'pending' | 'info' | 'warning';
  isNew?: boolean;
  avatars?: string[];
}

const statusColors = {
  completed: 'bg-green-500',
  pending: 'bg-yellow-500',
  info: 'bg-blue-500',
  warning: 'bg-red-500',
};

const TimelineCard = () => {
  const timelineItems: TimelineItem[] = [
    { id: '1', title: 'All Hands Meeting', status: 'warning' },
    { id: '2', title: 'Yet another one', time: '15:00 PM', status: 'pending' },
    { id: '3', title: 'Build the production release', status: 'completed', isNew: true, avatars: ['A', 'B', 'C', 'D', 'E'] },
    { id: '4', title: 'Something not important', status: 'info', avatars: ['A', 'B'] },
    { id: '5', title: 'Yet another one', time: '15:00 PM', status: 'pending' },
    { id: '6', title: 'Build the production release', status: 'completed', isNew: true },
    { id: '7', title: 'This dot has an info state', status: 'info' },
    { id: '8', title: 'This dot has a dark state', status: 'completed' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-pink-500" />
          Timeline Example
        </CardTitle>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full ${statusColors[item.status]} mt-1.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-foreground">{item.title}</p>
                  {item.time && (
                    <span className="text-xs text-green-600">{item.time}</span>
                  )}
                  {item.isNew && (
                    <Badge variant="destructive" className="text-xs h-5">NEW</Badge>
                  )}
                </div>
                {item.avatars && (
                  <div className="flex -space-x-2 mt-2">
                    {item.avatars.map((avatar, idx) => (
                      <Avatar key={idx} className="h-7 w-7 border-2 border-background">
                        <AvatarFallback className="bg-muted text-xs">{avatar}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full mt-4 bg-gray-800 hover:bg-gray-900">
          View All Messages
        </Button>
      </CardContent>
    </Card>
  );
};

export default TimelineCard;
