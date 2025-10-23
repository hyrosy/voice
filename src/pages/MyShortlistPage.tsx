import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, User, Music } from 'lucide-react';

interface LikedDemo {
  id: string;
  demo_url: string;
  actors: {
    ActorName: string;
    slug: string;
    HeadshotURL: string;
  };
}

const MyShortlistPage = () => {
    const [loading, setLoading] = useState(true);
    const [likedDemos, setLikedDemos] = useState<LikedDemo[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLikedDemos = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/client-auth'); // Redirect if not logged in
                return;
            }

            const { data, error } = await supabase
                .from('demo_likes')
                .select('id, demo_url, actors(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Error fetching liked demos:", error);
            } else {
                setLikedDemos(data as LikedDemo[]);
            }
            setLoading(false);
        };
        fetchLikedDemos();
    }, [navigate]);

    if (loading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Your Shortlist...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <div className="max-w-4xl mx-auto py-20 px-4">
                <div className="text-center mb-12">
                    <div className="inline-block bg-slate-800/50 rounded-full p-5 border border-slate-700 mb-6">
                        <Heart size={40} className="text-pink-400" />
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white mb-4">
                        My Shortlist
                    </h1>
                    <p className="text-lg text-slate-400">All the voice demos you've liked, saved in one place.</p>
                </div>
                
                <div className="space-y-4">
                    {likedDemos.length > 0 ? (
                        likedDemos.map(like => (
                            <div key={like.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-4">
                                    <img src={like.actors.HeadshotURL} alt={like.actors.ActorName} className="w-16 h-16 rounded-md object-cover" />
                                    <div className="flex-grow">
                                        <Link to={`/actor/${like.actors.slug}`} className="font-bold text-white hover:text-purple-400 transition-colors">
                                            {like.actors.ActorName}
                                        </Link>
                                        <p className="text-sm text-slate-400">Main Demo Reel</p>
                                    </div>
                                    <audio controls src={like.demo_url} className="h-10"></audio>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-center py-8">You haven't liked any demos yet. Start browsing to create your shortlist!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyShortlistPage;
