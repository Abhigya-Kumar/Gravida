import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { PatientList } from './PatientList';
import { MedicationSuggestion } from './MedicationSuggestion';
import { Home, Users, Pill, Activity, TrendingUp, Clock, LogOut, Menu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Real Gravida Care logo from public folder
const logoImage = '/gravida-logo.jpeg';

export function DoctorDashboard({ doctorName, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [highlightCritical, setHighlightCritical] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { value: 'home', icon: Home, label: 'Dashboard' },
    { value: 'patients', icon: Users, label: 'Patients' },
    { value: 'medication', icon: Pill, label: 'AI Medication' },
  ];

  const weeklyData = [
    { day: 'Mon', appointments: 12, consultations: 8 },
    { day: 'Tue', appointments: 5, consultations: 10 },
    { day: 'Wed', appointments: 10, consultations: 7 },
    { day: 'Thu', appointments: 18, consultations: 12 },
    { day: 'Fri', appointments: 14, consultations: 9 },
    { day: 'Sat', appointments: 8, consultations: 5 },
    { day: 'Sun', appointments: 4, consultations: 3 }
  ];

  const patientStats = [
    { trimester: '1st', count: 28 },
    { trimester: '2nd', count: 42 },
    { trimester: '3rd', count: 35 }
  ];

  return (
    <div className="min-h-screen bg-[#FFF5F8]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Gravida Care" className="h-8 md:h-10" />
            <div className="hidden sm:block border-l pl-3 ml-3">
              <span className="text-xs md:text-sm text-muted-foreground">Doctor Portal</span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Dr. <span className="font-semibold">{doctorName}</span></span>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <img src={logoImage} alt="Gravida" className="h-8" />
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="pb-4 border-b">
                    <p className="text-sm text-muted-foreground">Doctor Portal</p>
                    <p className="font-semibold">Dr. {doctorName}</p>
                  </div>
                  
                  {/* Navigation Items */}
                  <div className="space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.value}
                          variant={activeTab === item.value ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            activeTab === item.value 
                              ? 'bg-[#FF69B4] text-white hover:bg-[#FF59A4]' 
                              : ''
                          }`}
                          onClick={() => {
                            setActiveTab(item.value);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {item.label}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-4 border-t space-y-2">
                    <p className="text-sm font-semibold mb-2">Quick Actions</p>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        setHighlightCritical(true);
                        setActiveTab('patients');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Critical Alerts
                    </Button>
                  </div>

                  {/* Settings */}
                  <div className="pt-4 border-t space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                      onClick={onLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-3 md:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          {/* Desktop Tabs */}
          <TabsList className="hidden md:flex bg-white p-1 shadow-sm w-full">
            <TabsTrigger value="home" className="data-[state=active]:bg-[#FF69B4] data-[state=active]:text-white flex-1">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-[#FF69B4] data-[state=active]:text-white flex-1">
              <Users className="w-4 h-4 mr-2" />
              Patients
            </TabsTrigger>
            <TabsTrigger value="medication" className="data-[state=active]:bg-[#FF69B4] data-[state=active]:text-white flex-1">
              <Pill className="w-4 h-4 mr-2" />
              AI Medication
            </TabsTrigger>
          </TabsList>

          {/* Mobile - Show current page title */}
          <div className="md:hidden bg-white p-3 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {menuItems.find(item => item.value === activeTab) && (
                <>
                  {(() => {
                    const Icon = menuItems.find(item => item.value === activeTab).icon;
                    return <Icon className="w-5 h-5 text-[#FF69B4]" />;
                  })()}
                  {menuItems.find(item => item.value === activeTab).label}
                </>
              )}
            </h2>
          </div>

          <TabsContent value="home" className="space-y-4 md:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="bg-[#FFD1E3]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">Total Patients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span className="text-3xl font-bold">105</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">+8 this month</p>
                </CardContent>
              </Card>

              <Card className="bg-[#B8D4F1]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">Today's Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-3xl font-bold">12</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">3 remaining</p>
                </CardContent>
              </Card>

              <Card className="bg-[#CCF5E8]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">Critical Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    <span className="text-3xl font-bold">3</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                </CardContent>
              </Card>

              <Card className="bg-[#FFE5CC]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-3xl font-bold">98%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Positive outcomes</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-bold">Weekly Activity</CardTitle>
                  <CardDescription>Appointments per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="appointments" 
                        fill="#5B7FDB" 
                        radius={[8, 8, 0, 0]}
                        name="Appointments"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-bold">Patient Distribution</CardTitle>
                  <CardDescription>By trimester</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={patientStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="trimester" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FF69B4" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg font-bold">Quick Actions</CardTitle>
                <CardDescription className="text-sm">Frequently used features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                    onClick={() => setActiveTab('patients')}
                  >
                    <Users className="w-6 h-6" />
                    <span className="font-semibold">View All Patients</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                    onClick={() => setActiveTab('medication')}
                  >
                    <Pill className="w-6 h-6" />
                    <span className="font-semibold">AI Prescriptions</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                    onClick={() => {
                      setHighlightCritical(true);
                      setActiveTab('patients');
                    }}
                  >
                    <Activity className="w-6 h-6" />
                    <span className="font-semibold">Critical Alerts</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Patients */}
            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Recent Consultations</CardTitle>
                <CardDescription>Latest patient interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Sarah Johnson', time: '10:30 AM', status: 'Completed', trimester: '24 weeks' },
                    { name: 'Emily Chen', time: '11:15 AM', status: 'Completed', trimester: '32 weeks' },
                    { name: 'Maria Garcia', time: '2:00 PM', status: 'Upcoming', trimester: '28 weeks' },
                    { name: 'Lisa Anderson', time: '3:30 PM', status: 'Upcoming', trimester: '18 weeks' }
                  ].map((patient, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#B8D4F1] hover:bg-[#A8C4E1] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FF69B4] flex items-center justify-center text-white font-semibold">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">{patient.trimester}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{patient.time}</div>
                        <div className={`text-xs ${patient.status === 'Completed' ? 'text-green-600' : 'text-orange-600'}`}>
                          {patient.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients">
            <PatientList 
              highlightCritical={highlightCritical} 
              onHighlightComplete={() => setHighlightCritical(false)}
            />
          </TabsContent>

          <TabsContent value="medication">
            <MedicationSuggestion />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
