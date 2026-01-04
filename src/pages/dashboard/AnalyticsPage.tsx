import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '@/layouts/ActorDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, MousePointerClick, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const AnalyticsPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalClicks: 0,
    viewsTrend: [] as any[],
    recentEvents: [] as any[]
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!actorData.id) return;

      setLoading(true);

      // 1. Get Total Views (All time)
      const { count: viewCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('actor_id', actorData.id)
        .eq('event_type', 'page_view');

      // 2. Get Shop Clicks (All time)
      const { count: clickCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('actor_id', actorData.id)
        .neq('event_type', 'page_view'); // Anything not a view is an interaction

      // 3. Get Daily Trend (Using the RPC function we created)
      const { data: trendData } = await supabase
        .rpc('get_daily_views', { target_actor_id: actorData.id });

      // 4. Get Recent Activity Logs (Last 5)
      const { data: recentLogs } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('actor_id', actorData.id)
        .neq('event_type', 'page_view') // Only show interactions
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalViews: viewCount || 0,
        totalClicks: clickCount || 0,
        viewsTrend: trendData || [],
        recentEvents: recentLogs || []
      });

      setLoading(false);
    };

    fetchAnalytics();
  }, [actorData.id]);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-7xl mx-auto ">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight pt-20">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Track your portfolio performance and shop engagement.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">+ from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
            <p className="text-xs text-muted-foreground">Clicks on Shop/Links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conv. Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {stats.totalViews > 0 ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Page View to Click</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Traffic Overview (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                {stats.viewsTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.viewsTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} 
                                stroke="#888888" 
                                fontSize={12} 
                            />
                            <YAxis stroke="#888888" fontSize={12} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="view_count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                        No traffic data yet. Share your link!
                    </div>
                )}
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {stats.recentEvents.length > 0 ? (
                        stats.recentEvents.map((event, i) => (
                            <div key={event.id || i} className="flex items-start gap-4">
                                <div className="bg-primary/10 p-2 rounded-full mt-1">
                                    {event.event_type.includes('whatsapp') ? <MessageCircleIcon /> : <ShoppingBag className="w-4 h-4 text-primary" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {event.event_type === 'whatsapp_click' ? 'Started WhatsApp Order' : 'Clicked Product Link'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(event.created_at).toLocaleDateString()} at {new Date(event.created_at).toLocaleTimeString()}
                                    </p>
                                    {event.metadata?.product_name && (
                                        <Badge variant="outline" className="mt-1 text-[10px]">
                                            {event.metadata.product_name}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">No recent interactions.</p>
                    )}
                </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
};

// Simple Icon Helper
const Badge = ({ children, variant, className }: any) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted ${className}`}>{children}</span>
);
const MessageCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>;

export default AnalyticsPage;