import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Apple, Coffee, Salad, Pizza, Plus, Check, Search } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Input } from '../ui/input';

export function DietPlanner() {
  const [searchQuery, setSearchQuery] = useState('');
  const [waterGlasses, setWaterGlasses] = useState([
    true, true, true, true, true, false, false, false
  ]);
  
  const [todaysMeals, setTodaysMeals] = useState([
    {
      id: '1',
      name: 'Oatmeal with Berries',
      calories: 350,
      protein: 12,
      carbs: 58,
      fat: 8,
      time: 'Breakfast',
      logged: true
    },
    {
      id: '2',
      name: 'Grilled Chicken Salad',
      calories: 420,
      protein: 35,
      carbs: 25,
      fat: 18,
      time: 'Lunch',
      logged: true
    },
    {
      id: '3',
      name: 'Greek Yogurt & Nuts',
      calories: 200,
      protein: 15,
      carbs: 20,
      fat: 8,
      time: 'Snack',
      logged: false
    },
    {
      id: '4',
      name: 'Salmon with Vegetables',
      calories: 520,
      protein: 40,
      carbs: 35,
      fat: 22,
      time: 'Dinner',
      logged: false
    }
  ]);

  const dailyTarget = {
    calories: 2100,
    protein: 100,
    carbs: 250,
    fat: 70
  };

  const consumed = todaysMeals
    .filter(m => m.logged)
    .reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const nutritionData = [
    { name: 'Protein', value: consumed.protein, color: '#5B7FDB' },
    { name: 'Carbs', value: consumed.carbs, color: '#FF69B4' },
    { name: 'Fat', value: consumed.fat, color: '#87CEEB' }
  ];

  const toggleMealLogged = (id) => {
    setTodaysMeals(meals =>
      meals.map(meal =>
        meal.id === id ? { ...meal, logged: !meal.logged } : meal
      )
    );
  };

  const toggleWaterGlass = (index) => {
    setWaterGlasses(glasses => 
      glasses.map((filled, i) => i === index ? !filled : filled)
    );
  };

  const waterGlassesCount = waterGlasses.filter(Boolean).length;
  const waterIntakeLiters = (waterGlassesCount * 0.3125).toFixed(1); // Each glass is ~312.5ml

  const recommendedFoods = [
    { name: 'Spinach', benefit: 'Rich in iron and folate', icon: '🥬' },
    { name: 'Salmon', benefit: 'Omega-3 for baby brain', icon: '🐟' },
    { name: 'Eggs', benefit: 'Complete protein source', icon: '🥚' },
    { name: 'Greek Yogurt', benefit: 'Calcium and probiotics', icon: '🥛' },
    { name: 'Berries', benefit: 'Antioxidants and fiber', icon: '🫐' },
    { name: 'Sweet Potato', benefit: 'Vitamin A and fiber', icon: '🍠' }
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredFoods = searchQuery
    ? recommendedFoods.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.benefit.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recommendedFoods;

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for meals, nutrients, or foods..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      {/* Daily Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">Today's Nutrition</CardTitle>
            <CardDescription>Track your daily intake</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Calories</span>
                <span className="font-medium">
                  {consumed.calories} / {dailyTarget.calories} kcal
                </span>
              </div>
              <Progress 
                value={(consumed.calories / dailyTarget.calories) * 100} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span>Protein</span>
                <span className="font-medium">
                  {consumed.protein}g / {dailyTarget.protein}g
                </span>
              </div>
              <Progress 
                value={(consumed.protein / dailyTarget.protein) * 100} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span>Carbs</span>
                <span className="font-medium">
                  {consumed.carbs}g / {dailyTarget.carbs}g
                </span>
              </div>
              <Progress 
                value={(consumed.carbs / dailyTarget.carbs) * 100} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span>Fat</span>
                <span className="font-medium">
                  {consumed.fat}g / {dailyTarget.fat}g
                </span>
              </div>
              <Progress 
                value={(consumed.fat / dailyTarget.fat) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-bold">Macronutrient Distribution</CardTitle>
            <CardDescription>Your nutrient breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={nutritionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}g`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {nutritionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Meal Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Today's Meal Plan</CardTitle>
          <CardDescription>Check off meals as you eat them</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todaysMeals.map((meal) => (
              <div
                key={meal.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  meal.logged
                    ? 'bg-[#B8D4F1] border-[#5B7FDB]'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={meal.logged ? 'default' : 'outline'} className="font-semibold">
                        {meal.time}
                      </Badge>
                      <h4 className="font-semibold">{meal.name}</h4>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>🔥 <span className="font-semibold">{meal.calories}</span> cal</span>
                      <span>🥩 <span className="font-semibold">{meal.protein}</span>g protein</span>
                      <span>🍚 <span className="font-semibold">{meal.carbs}</span>g carbs</span>
                      <span>🥑 <span className="font-semibold">{meal.fat}</span>g fat</span>
                    </div>
                  </div>
                  <Button
                    variant={meal.logged ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleMealLogged(meal.id)}
                    className={meal.logged ? 'bg-[#5B7FDB] font-semibold' : 'font-semibold'}
                  >
                    {meal.logged ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Logged
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Log
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pregnancy-Specific Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Recommended Foods for Pregnancy</CardTitle>
          <CardDescription>Essential nutrients for you and your baby</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFoods.map((food, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-[#FFD1E3] hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-2">{food.icon}</div>
                <h4 className="mb-1 font-bold">{food.name}</h4>
                <p className="text-sm text-muted-foreground">{food.benefit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Water Intake */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Hydration Tracker</CardTitle>
          <CardDescription><span className="font-semibold">Daily water intake goal: 2.5L</span> (Click glasses to track)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            {waterGlasses.map((filled, i) => (
              <div
                key={i}
                onClick={() => toggleWaterGlass(i)}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
                  filled ? 'bg-[#CCF5E8] shadow-md' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <Coffee className={`w-6 h-6 ${filled ? 'text-[#2C7A7B]' : 'text-gray-400'}`} />
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold">{waterGlassesCount} out of 8 glasses</span> ({waterIntakeLiters}L / 2.5L)
          </div>
          <Progress value={(waterGlassesCount / 8) * 100} className="h-2 mt-2" />
        </CardContent>
      </Card>

      {/* Weekly Meal Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">AI-Generated Meal Suggestions</CardTitle>
          <CardDescription>Based on your nutritional needs and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="breakfast">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
              <TabsTrigger value="lunch">Lunch</TabsTrigger>
              <TabsTrigger value="snack">Snacks</TabsTrigger>
              <TabsTrigger value="dinner">Dinner</TabsTrigger>
            </TabsList>
            
            <TabsContent value="breakfast" className="space-y-3 mt-4">
              {[
                'Avocado Toast with Poached Egg',
                'Whole Grain Pancakes with Fresh Fruit',
                'Smoothie Bowl with Granola'
              ].map((meal, i) => (
                <div key={i} className="p-3 bg-[#E8DBFF] rounded-lg flex items-center justify-between">
                  <span className="font-semibold">{meal}</span>
                  <Button size="sm" variant="outline" className="font-semibold">Add to Plan</Button>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="lunch" className="space-y-3 mt-4">
              {[
                'Quinoa Buddha Bowl',
                'Chicken Caesar Wrap',
                'Mediterranean Pasta Salad'
              ].map((meal, i) => (
                <div key={i} className="p-3 bg-[#E8DBFF] rounded-lg flex items-center justify-between">
                  <span className="font-semibold">{meal}</span>
                  <Button size="sm" variant="outline" className="font-semibold">Add to Plan</Button>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="snack" className="space-y-3 mt-4">
              {[
                'Almond Butter & Apple Slices',
                'Hummus with Veggie Sticks',
                'Protein Energy Balls'
              ].map((meal, i) => (
                <div key={i} className="p-3 bg-[#E8DBFF] rounded-lg flex items-center justify-between">
                  <span className="font-semibold">{meal}</span>
                  <Button size="sm" variant="outline" className="font-semibold">Add to Plan</Button>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="dinner" className="space-y-3 mt-4">
              {[
                'Baked Salmon with Roasted Vegetables',
                'Lean Beef Stir-fry with Brown Rice',
                'Lentil Curry with Naan'
              ].map((meal, i) => (
                <div key={i} className="p-3 bg-[#E8DBFF] rounded-lg flex items-center justify-between">
                  <span className="font-semibold">{meal}</span>
                  <Button size="sm" variant="outline" className="font-semibold">Add to Plan</Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
