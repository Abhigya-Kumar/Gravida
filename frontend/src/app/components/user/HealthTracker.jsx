import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Heart, Scale, Ruler, TrendingUp } from 'lucide-react';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';

export function HealthTracker() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('165');
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');

  const weightData = [
    { date: 'Week 20', weight: 62, bloodPressure: '120/80', heartRate: 75 },
    { date: 'Week 21', weight: 63, bloodPressure: '118/78', heartRate: 76 },
    { date: 'Week 22', weight: 63.5, bloodPressure: '122/82', heartRate: 74 },
    { date: 'Week 23', weight: 64, bloodPressure: '119/79', heartRate: 77 },
    { date: 'Week 24', weight: 65, bloodPressure: '121/81', heartRate: 75 },
  ];

  const calculateBMI = () => {
    if (weight && height) {
      const heightM = parseFloat(height) / 100;
      const bmi = parseFloat(weight) / (heightM * heightM);
      return bmi.toFixed(1);
    }
    return '0';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock save functionality
    toast.success('All the Measurements were Saved Successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Current Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#B8D4F1]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Current Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              <span className="text-2xl font-bold">65 kg</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">+1kg from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-[#FFD1E3]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">BMI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <span className="text-2xl font-bold">23.9</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Healthy range</p>
          </CardContent>
        </Card>

        <Card className="bg-[#CCF5E8]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Blood Pressure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              <span className="text-2xl font-bold">121/81</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Normal</p>
          </CardContent>
        </Card>

        <Card className="bg-[#FFE5CC]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Heart Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-2xl font-bold">75 bpm</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Normal</p>
          </CardContent>
        </Card>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Log Your Health Metrics</CardTitle>
          <CardDescription>Track your daily health measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="font-semibold">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="65.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="font-semibold">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="165"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp" className="font-semibold">Blood Pressure</Label>
                <Input
                  id="bp"
                  type="text"
                  placeholder="120/80"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr" className="font-semibold">Heart Rate (bpm)</Label>
                <Input
                  id="hr"
                  type="number"
                  placeholder="75"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                />
              </div>
            </div>
            
            {weight && height && (
              <div className="p-4 bg-[#E8DBFF] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Calculated BMI:</span>
                  <span className="text-2xl font-bold">{calculateBMI()}</span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-[#5B7FDB] hover:bg-[#4A6ECA] font-semibold">
              Save Measurements
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Weight Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Weight Progress</CardTitle>
          <CardDescription>Your weight tracking over the weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[60, 70]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#5B7FDB" 
                strokeWidth={3}
                dot={{ fill: '#5B7FDB', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Heart Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Heart Rate Monitoring</CardTitle>
          <CardDescription>Weekly heart rate averages</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[70, 80]} />
              <Tooltip />
              <Bar dataKey="heartRate" fill="#FF69B4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Health Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Personalized Health Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              title: 'Weight Gain',
              message: 'Your weight gain is on track. Aim for 0.5kg per week in the second trimester.',
              progress: 85,
              bgColor: '#B8D4F1'
            },
            {
              title: 'Blood Pressure',
              message: 'Your blood pressure readings are normal. Keep monitoring regularly.',
              progress: 95,
              bgColor: '#CCF5E8'
            },
            {
              title: 'Heart Health',
              message: 'Heart rate is stable. Continue light exercises as recommended.',
              progress: 90,
              bgColor: '#FFD1E3'
            }
          ].map((tip, index) => (
            <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: tip.bgColor }}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold">{tip.title}</h4>
                <span className="text-sm font-semibold">{tip.progress}%</span>
              </div>
              <p className="text-sm mb-2">{tip.message}</p>
              <Progress value={tip.progress} className="h-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
