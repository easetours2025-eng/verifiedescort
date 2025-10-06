import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { Settings, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const chartData = [
  { name: 'Jan', value: 30 },
  { name: 'Feb', value: 35 },
  { name: 'Mar', value: 28 },
  { name: 'Apr', value: 40 },
  { name: 'May', value: 38 },
  { name: 'Jun', value: 32 },
  { name: 'Jul', value: 45 },
  { name: 'Aug', value: 42 },
];

const ChartCard = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-500" />
          Technical Support
        </CardTitle>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Helpdesk Tickets */}
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-2">HELPDESK TICKETS</p>
            <div className="flex items-baseline gap-2 mb-4">
              <h3 className="text-4xl font-bold text-yellow-500">34</h3>
              <span className="text-sm text-muted-foreground">5% increase</span>
            </div>
            
            {/* Chart Navigation */}
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <div className="w-2 h-2 rounded-full bg-gray-300" />
              </div>
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Area Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales Progress */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground uppercase mb-4">SALES PROGRESS</p>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                  <span className="text-xl font-bold text-green-600">$ 1896</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Last year expenses</p>
                <Progress value={75} className="h-2" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">YoY Growth</span>
                <span className="font-medium">100%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartCard;
