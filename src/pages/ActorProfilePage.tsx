// In src/pages/ActorProfilePage.tsx

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import QuoteCalculatorModal from '../components/QuoteCalculatorModal';
import { Play, Pause, Mic, Phone, CheckCircle, Share2, Heart, UserPlus, Star } from 'lucide-react';
import GlobalAudioPlayer from '../components/GlobalAudioPlayer';

// Recommended: Move this to a central 'src/types.ts' file and import it
interface Demo {
  url: string | undefined;
  id: string;
  title: string;
  demo_url: string;
  language: string;
  style_tag: string;
  likes?: number; // Likes will be fetched separately
}

interface Actor {
  id: string;
  ActorName: string;
  bio: string | null;
  Gender: string;
  Language: string;
  Tags: string | null;
  HeadshotURL: string;
  MainDemoURL: string;
  revisions_allowed: number;
  BaseRate_per_Word: string;
  WebMultiplier: string;
  BroadcastMultiplier: string;
  ActorEmail: string;
  slug: string;
  actor_followers: { count: number }[];
  demo_likes: { count: number }[];
}

// --- NEW: Interface for Review Data (can be simplified for display) ---
interface ActorReview {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    // Optional: Add client name if you fetch it later
    // clients: { full_name: string } | null;
}

const ActorProfilePage = () => {
    // Correctly get the slug from the URL parameter named 'actorName'
    const { actorName: actorSlug } = useParams<{ actorName: string }>();
    const [actor, setActor] = useState<Actor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [totalLikes, setTotalLikes] = useState(0);
    const [userLikes, setUserLikes] = useState<string[]>([]);
    
    // --- ADD PLAYER STATE ---
    const [demos, setDemos] = useState<Demo[]>([]);
    const [currentTrack, setCurrentTrack] = useState<{ url: string, actor: { ActorName: string, HeadshotURL: string } } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    // --- NEW: Follow State ---
    const [isFollowing, setIsFollowing] = useState(false);
    // --- NEW: State for Reviews ---
    const [reviews, setReviews] = useState<ActorReview[]>([]);
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
    // --- END REVIEW STATE ---


    // Data fetching (already optimized)
    useEffect(() => {
    const getActorData = async () => {
        if (!actorSlug) return;
        setIsLoading(true);

        // 1. Fetch actor profile (includes TOTAL like count) - No change here
        const { data: actorData, error: actorError } = await supabase
            .from('actors')
            .select(`*, actor_followers(count), demo_likes(count)`) // Total likes here
            .eq('slug', actorSlug)
            .single();

        if (actorError || !actorData) { /* ... error handling ... */ return; }
        setActor(actorData);
        setFollowerCount(actorData.actor_followers[0]?.count || 0);
        setTotalLikes(actorData.demo_likes[0]?.count || 0); // Still set total likes
        setIsLoadingReviews(false); // Also stop review loading

        // --- NEW: Fetch Reviews for this Actor ---
            setIsLoadingReviews(true);
            try {
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('id, rating, comment, created_at') // Select necessary fields
                    // If fetching client name: .select('id, rating, comment, created_at, clients(full_name)')
                    .eq('actor_id', actorData.id) // Filter by the actor's ID
                    .order('created_at', { ascending: false }); // Show newest first

                if (reviewsError) {
                    console.error("Error fetching reviews:", reviewsError);
                    // Don't block page load, just won't show reviews
                } else if (reviewsData) {
                    setReviews(reviewsData as ActorReview[]);

                    // Calculate Average Rating
                    if (reviewsData.length > 0) {
                        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
                        const avg = totalRating / reviewsData.length;
                        setAverageRating(parseFloat(avg.toFixed(1))); // Round to one decimal place
                    } else {
                        setAverageRating(null); // No reviews yet
                    }
                }
            } catch (e) {
                console.error("Exception fetching reviews:", e);
            } finally {
                setIsLoadingReviews(false);
            }
            // --- END REVIEW FETCH ---

        // 2. Fetch all demos for this actor - No change here
        const { data: demosData, error: demosError } = await supabase
            .from('demos')
            .select('*')
            .eq('actor_id', actorData.id);
        if (demosError) console.error("Error fetching demos:", demosError);

        // 3. Build list of demo URLs - No change here
        const otherDemoUrls = (demosData || []).map(d => d.demo_url);
        const demoUrls = [actorData.MainDemoURL, ...otherDemoUrls].filter(Boolean);

        // --- MODIFICATION START ---
        // 4. Fetch ALL like rows for these demos to count them client-side
        let likesByURL: { [url: string]: number } = {}; // Initialize count map
        if (demoUrls.length > 0) {
            const { data: allLikesData, error: likesFetchError } = await supabase
                .from('demo_likes')
                .select('demo_url') // Just select the URL to count occurrences
                .in('demo_url', demoUrls);

            if (likesFetchError) {
                console.error("Error fetching individual demo likes:", likesFetchError);
            } else {
                // Count occurrences of each URL
                likesByURL = (allLikesData || []).reduce((acc, like) => {
                    acc[like.demo_url] = (acc[like.demo_url] || 0) + 1;
                    return acc;
                }, {} as { [url: string]: number });
            }
        }
        // --- MODIFICATION END ---

        // 5. Check user's like status (fetch user's specific likes) - No change here
        let userLikesData: string[] = [];
        const { data: { user } } = await supabase.auth.getUser();
        if (user && demoUrls.length > 0) {
            const { data: userLikesResult, error: userLikesError } = await supabase
                .from('demo_likes')
                .select('demo_url')
                .eq('user_id', user.id)
                .in('demo_url', demoUrls);
            if (userLikesError) console.error("Error fetching user likes:", userLikesError);
            else if (userLikesResult) userLikesData = userLikesResult.map(l => l.demo_url);

            // Check follow status - No change here
            const { data: followData } = await supabase.from('actor_followers').select().eq('actor_id', actorData.id).eq('user_id', user.id);
            if (followData && followData.length > 0) setIsFollowing(true);
        }
        setUserLikes(userLikesData); // Set user likes state


        // 6. Combine all data using the client-side counts - MODIFIED
        const mainDemoTrack = {
            id: 'main_demo',
            title: 'Main Demo Reel',
            demo_url: actorData.MainDemoURL,
            language: actorData.Language,
            style_tag: 'General',
            // Use the counts calculated above
            likes: likesByURL[actorData.MainDemoURL] || 0
        };

            const otherDemos = (demosData || []).map(d => ({
            ...d,
            // Use the counts calculated above - THIS LINE NEEDS FIXING
            likes: likesByURL[d.demo_url] || 0 // <-- FIX: Use likesByURL here too
        }));
            
        setDemos([mainDemoTrack, ...otherDemos].filter(d => d.demo_url)); // Ensure demos without URL are filtered out
        setIsLoading(false);
        };
        getActorData();
    }, [actorSlug]);


    // --- NEW: Functions to handle like/follow actions ---
    const handleToggleFollow = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !actor) return; // Must be logged in

        if (isFollowing) {
            await supabase.from('actor_followers').delete().match({ user_id: user.id, actor_id: actor.id });
            setFollowerCount(prev => prev - 1);
        } else {
            await supabase.from('actor_followers').insert({ user_id: user.id, actor_id: actor.id });
            setFollowerCount(prev => prev + 1);
        }
        setIsFollowing(!isFollowing);
    };

    const handleToggleLike = async (demo: Demo) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !actor) return; // Must be logged in

        const isCurrentlyLiked = userLikes.includes(demo.demo_url);
        
        if (isCurrentlyLiked) {
            await supabase.from('demo_likes').delete().match({ user_id: user.id, demo_url: demo.demo_url });
            setUserLikes(prev => prev.filter(url => url !== demo.demo_url));
            setDemos(prev => prev.map(d => d.demo_url === demo.demo_url ? { ...d, likes: (d.likes || 1) - 1 } : d));
            setTotalLikes(prev => prev - 1);
        } else {
            await supabase.from('demo_likes').insert({ user_id: user.id, actor_id: actor.id, demo_url: demo.demo_url });
            setUserLikes(prev => [...prev, demo.demo_url]);
            setDemos(prev => prev.map(d => d.demo_url === demo.demo_url ? { ...d, likes: (d.likes || 0) + 1 } : d));
            setTotalLikes(prev => prev + 1);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [currentTrack]);

    // Audio player logic (no changes needed)
    useEffect(() => {
        if (isPlaying) audioRef.current?.play().catch(console.error);
        else audioRef.current?.pause();
    }, [isPlaying, currentTrack]);



    const handlePlayPause = (demo?: Demo) => {
        const targetDemo = demo || demos[0];
        if (!targetDemo || !actor) return;
        
        const newTrack = {
            url: targetDemo.demo_url,
            actor: {
                ActorName: actor.ActorName,
                HeadshotURL: actor.HeadshotURL
            }
        };
        
        if (currentTrack?.url === newTrack.url) {
            setIsPlaying(!isPlaying);
        } else {
            setCurrentTrack(newTrack);
            setIsPlaying(true);
        }
    };

    

    // --- NEW: Robust Share Function ---
    const handleShare = async () => {
        const shareData = {
            title: `Voice Actor: ${actor?.ActorName}`,
            text: `Check out the voice actor profile for ${actor?.ActorName}!`,
            url: window.location.href,
        };

        // Use the modern Web Share API if available
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Share failed:", err);
            }
        } else {
            // Fallback for desktop browsers: copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Profile link copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy:', err);
                alert('Failed to copy link.');
            }
        }
    };
    
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <p>Loading...</p>
            </div>
        );
    }

    if (error || !actor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <p>{error || 'Actor not found.'}</p>
            </div>
        );
    }

    // --- Helper to render stars ---
    const renderStars = (rating: number, size = 16) => {
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={size}
                        className={` ${
                            star <= rating ? 'text-yellow-400 fill-current' : 'text-slate-600'
                        }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <audio ref={audioRef} src={currentTrack?.url || ''} />
            
            <header className="h-auto md:h-96 relative flex items-end bg-gradient-to-t from-slate-900 via-purple-900/50 to-purple-800">
                {/* --- NEW: Added a max-width container with padding --- */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
                    <div className="flex flex-row items-center gap-4 md:gap-8 z-10 w-full">
                        <img 
                            src={actor.HeadshotURL} 
                            alt={actor.ActorName} 
                            className="w-28 h-28 md:w-52 md:h-52 rounded-full object-cover flex-shrink-0 shadow-2xl shadow-black/50"
                        />
                        {/* MODIFIED: Added text-center on small screens */}
                        <div className="text-center md:text-left flex-grow">
                             {/* ... Verified Badge ... */}
                            <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter text-white break-words">{actor.ActorName}</h1>
                             {/* MODIFIED: Added Average Rating display */}
                             <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-x-3 gap-y-1 text-slate-300 text-sm md:text-base mt-1 md:mt-2">
                                <span>{actor.Language} | {actor.Gender}</span>
                                <span className="hidden sm:inline mx-1">&middot;</span>
                                 <span>{followerCount} Followers</span>
                                 <span className="hidden sm:inline mx-1">&middot;</span>
                                 <span>{totalLikes.toLocaleString()} Likes</span>
                                 {averageRating !== null && (
                                     <>
                                         <span className="hidden sm:inline mx-1">&middot;</span>
                                         <span className="flex items-center gap-1">
                                            {renderStars(averageRating, 14)} ({averageRating})
                                         </span>
                                         </>
                                 )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            {/* --- NEW: Added a max-width container with padding --- */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 sm:gap-6 mb-12 flex-wrap">                    <button onClick={() => handlePlayPause()} className="w-16 h-16 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                        {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                    </button>
                <button onClick={() => setIsQuoteModalOpen(true)} className="px-4 sm:px-6 py-3 border-2 border-slate-600 hover:border-white rounded-full text-white font-bold text-sm transition flex-shrink-0"> {/* Added flex-shrink-0 */}                        Get a Quote
                    </button>
                <button onClick={handleShare} className="p-2.5 sm:p-3 border-2 border-slate-600 hover:border-white rounded-full text-slate-300 hover:text-white transition flex-shrink-0"> {/* Added flex-shrink-0 */}                        <Share2 size={18} />
                    </button>
                <button onClick={handleToggleFollow} className={`px-4 sm:px-6 py-3 border-2 rounded-full font-bold text-sm transition ${isFollowing ? 'bg-white text-slate-900 border-white' : 'border-slate-600 text-white hover:border-white'} flex-shrink-0`}> {/* Added flex-shrink-0 */}                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                </div>

                {/* Demo Tracklist */}
                <div className="mb-12">
                    <div className="flex flex-col">
                        {demos.map((demo, index) => (
                            <div key={demo.id} className="group grid grid-cols-[40px_1fr_auto_auto] items-center gap-4 p-2 rounded-lg hover:bg-slate-800/50">
                                <div onClick={() => handlePlayPause(demo)} className="flex items-center justify-center text-slate-400 cursor-pointer">
                                    {currentTrack?.url === demo.demo_url && isPlaying ? (
                                        <Pause size={16} className="text-purple-400" />
                                    ) : (
                                        <>
                                            <span className="group-hover:hidden">{index + 1}</span>
                                            <Play size={16} className="text-white hidden group-hover:block" />
                                        </>
                                    )}
                                </div>
                                <div onClick={() => handlePlayPause(demo)} className="cursor-pointer">
                                    <p className={`font-semibold truncate ${currentTrack?.url === demo.demo_url ? 'text-purple-400' : 'text-white'}`}>{demo.title}</p>
                                    <p className="text-sm text-slate-400">{demo.language} | {demo.style_tag}</p>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <button onClick={() => handleToggleLike(demo)}>
                                        <Heart size={16} className={`transition-colors ${userLikes.includes(demo.demo_url) ? 'text-pink-500 fill-current' : 'text-slate-500 group-hover:text-white'}`} />
                                    </button>
                                    <span className="text-sm w-8">{demo.likes}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bio Section */}
                {actor?.bio && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">About</h2>
                        <p className="text-slate-400 leading-relaxed whitespace-pre-wrap max-w-3xl">
                            {actor?.bio}
                        </p>
                    </div>
                )}

                {/* --- NEW: Reviews Section --- */}
                 <div className="mt-12 pt-8 border-t border-slate-700">
                     <h2 className="text-2xl font-bold mb-6">Reviews ({reviews.length})</h2>
                     {isLoadingReviews ? (
                        <p className="text-slate-400">Loading reviews...</p>
                     ) : reviews.length > 0 ? (
                         <div className="space-y-6 max-w-3xl">
                             {reviews.map((review) => (
                                 <div key={review.id} className="pb-4 border-b border-slate-800 last:border-b-0">
                                     <div className="flex items-center justify-between mb-2">
                                         {renderStars(review.rating)}
                                         <span className="text-xs text-slate-500">
                                             {new Date(review.created_at).toLocaleDateString()}
                                         </span>
                                     </div>
                                     {review.comment && (
                                         <p className="text-slate-300 bg-slate-800/50 p-3 rounded text-sm italic">
                                             "{review.comment}"
                                         </p>
                                     )}
                                     {/* Placeholder for client name if fetched later */}
                                     {/* <p className="text-xs text-slate-500 mt-1">By: {review.clients?.full_name || 'Client'}</p> */}
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <p className="text-slate-500">No reviews yet for this actor.</p>
                     )}
                 </div>
                 {/* --- END Reviews Section --- */}

            </main>

            {/* --- ADD THE PLAYER --- */}
            <GlobalAudioPlayer
                audioRef={audioRef}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayPause={() => handlePlayPause()}
                duration={duration}
                currentTime={currentTime}
            />

            {isQuoteModalOpen && actor && ( <QuoteCalculatorModal actor={actor} onClose={() => setIsQuoteModalOpen(false)} /> )}
        </div>
    );
};

export default ActorProfilePage;