
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import OrderDetailsModal from '../components/OrderDetailsModal';
// Import icons needed for tabs if desired (e.g., User, DollarSign)
import { ChevronDown, ChevronUp, Music, Trash2, UploadCloud, User, DollarSign, Settings, Banknote, CheckCircle, AudioLines, Plus, Play, Brain } from 'lucide-react';
import emailjs from '@emailjs/browser';
import RecordingModal from '../components/RecordingModal'; // <-- Import new component


// --- NEW: Define the controlled options for our dropdowns ---
const genderOptions = ["Male", "Female"];
const languageOptions = ["Arabic", "English", "French", "Spanish"];
const tagOptions = ["Warm", "Deep", "Conversational", "Corporate"];

// --- NEW: Interface for Recording Library ---
interface ActorRecording {
  id: string;
  actor_id: string;
  name: string;
  raw_audio_url: string;
  cleaned_audio_url: string | null;
  status: 'raw' | 'cleaning' | 'cleaned' | 'error';
  created_at: string;
}

// --- Interfaces ---
interface Demo {
  id: string;
  title: string;
  language: string;
  style_tag: string;
  demo_url: string;
}

// 1. Define clear, specific interfaces for our data
interface Actor {
  id: string;
  ActorName: string;
  bio: string;
  Gender: string;
  slug: string;
  Language: string;
  Tags: string;
  BaseRate_per_Word: number;
  revisions_allowed: number;
  WebMultiplier: number;
  BroadcastMultiplier: number;
  HeadshotURL?: string;
  MainDemoURL?: string;
  // Add Bank Details & Flags
  bank_name?: string | null;
  bank_holder_name?: string | null;
  bank_iban?: string | null;
  bank_account_number?: string | null;
  direct_payment_enabled?: boolean;
  direct_payment_requested?: boolean;
}

interface Order {
  actor_id: string;
  id: string;
  order_id_string: string;
  client_name: string;
  client_email: string; // added to match OrderDetailsModal's expected type
  status: string;
  script: string;
  final_audio_url?: string;
  // Add other fields from your 'orders' table as needed

}

type ProfileTab = 'info' | 'rates' | 'payout';

const ActorDashboardPage = () => {
    // 2. All state is declared once at the top
    const [loading, setLoading] = useState(true);
    const [actorData, setActorData] = useState<Partial<Actor>>({});
    const [orders, setOrders] = useState<Order[]>([]);
    const [message, setMessage] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>('info');
    // --- NEW State for Demos ---
    const [isDemosOpen, setIsDemosOpen] = useState(true); // Open by default
    const [demos, setDemos] = useState<Demo[]>([]);
    const [uploading, setUploading] = useState(false);
    const [newDemo, setNewDemo] = useState({ title: '', language: '', style_tag: '' });
    const [demoFile, setDemoFile] = useState<File | null>(null);
    const [uploadingMainDemo, setUploadingMainDemo] = useState(false);
    const [demoMessage, setDemoMessage] = useState('');

    // --- NEW: State for Eligibility Data ---
    const [completedOrderCount, setCompletedOrderCount] = useState<number>(0);
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [eligibilityLoading, setEligibilityLoading] = useState<boolean>(true); // Separate loading state
    // --- END Eligibility State ---

    // --- NEW: State for Recording Library ---
    const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
    const [recordings, setRecordings] = useState<ActorRecording[]>([]);
    const [isSavingRecording, setIsSavingRecording] = useState(false);
    // ---
    // --- NEW: State to track which recording is cleaning ---
    const [cleaningId, setCleaningId] = useState<string | null>(null);


    // 3. A single, combined function to fetch all necessary data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setEligibilityLoading(true); // Start eligibility loading
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/actor-login');
            return;
        }

       const { data: actorProfile, error: actorError } = await supabase.from('actors').select('*').eq('user_id', user.id).single();
        if (actorError || !actorProfile) {
           // User is logged in but HAS NO actor profile.
           // Redirect them to the profile creation prompt.
           console.warn('No actor profile found, redirecting to create one.');
           navigate('/create-profile', { state: { roleToCreate: 'actor' } });
           return;
       }
        setActorData(actorProfile);

        const { data: orderData } = await supabase.from('orders').select('*').eq('actor_id', actorProfile.id).order('created_at', { ascending: false });
        if (orderData) {
            setOrders(orderData as Order[]);
        }
        
        // NEW: Fetch existing demos for this actor
        const { data: demosData } = await supabase.from('demos').select('*').eq('actor_id', actorProfile.id).order('created_at', { ascending: false });
        if(demosData) setDemos(demosData);

        // --- NEW: Fetch Eligibility Data ---
    try {
        // Fetch completed order count
        const { count: orderCount, error: orderCountError } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('actor_id', actorProfile.id)
            .eq('status', 'Completed');

        if (orderCountError) throw orderCountError;
        setCompletedOrderCount(orderCount ?? 0);

        // Fetch reviews to calculate average rating
        const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('actor_id', actorProfile.id);

        if (reviewsError) throw reviewsError;

        if (reviewsData && reviewsData.length > 0) {
            const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
            const avg = totalRating / reviewsData.length;
            setAverageRating(parseFloat(avg.toFixed(1)));
        } else {
            setAverageRating(null); // No reviews yet
        }
    } catch (error) {
        console.error("Error fetching eligibility data:", error);
        setMessage("Could not load eligibility data."); // Show feedback
        // Set default/error values
        setCompletedOrderCount(0);
        setAverageRating(null);
    } finally {
        setEligibilityLoading(false); // Finish eligibility loading
    }
    // --- END Eligibility Fetch ---

    // --- NEW: Fetch actor_recordings ---
        const { data: recordingsData, error: recordingsError } = await supabase
            .from('actor_recordings')
            .select('*')
            .eq('actor_id', actorProfile.id)
            .order('created_at', { ascending: false });
            
        if (recordingsError) console.error("Error fetching recordings:", recordingsError);
        else setRecordings(recordingsData as ActorRecording[]);
        // ---


        setLoading(false);
    }, [navigate]);

    // 4. One useEffect to run the data fetching function
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // In src/pages/ActorDashboardPage.tsx

const handleRequestDirectPayment = async () => {
    setMessage(''); // Clear previous message
    if (!actorData.id) return;

    // Optional: Add confirmation dialog
    // if (!window.confirm("Are you sure you want to request direct payment setup?")) return;

    setMessage('Sending request...'); // Provide feedback

    try {
        const { error } = await supabase
            .from('actors')
            .update({ direct_payment_requested: true })
            .eq('id', actorData.id);

        if (error) throw error;

        // Update local state immediately
        setActorData(prev => ({ ...prev, direct_payment_requested: true }));
        setMessage('Request sent successfully! An admin will review it.');

    } catch (error) {
        const err = error as Error;
        console.error("Error requesting direct payment:", err);
        setMessage(`Failed to send request: ${err.message}`);
    }
};

    // --- NEW: Handlers for Demo Management ---
    const handleDemoInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewDemo({ ...newDemo, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setDemoFile(e.target.files[0]);
        }
    };

    const handleDemoUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!demoFile || !newDemo.title || !newDemo.language || !newDemo.style_tag || !actorData.id) {
            setDemoMessage("Please fill all demo fields and select a file.");
            return;
        }
        setUploading(true);
        setDemoMessage("Uploading demo...");

        try {
            // --- THIS IS THE FIX ---
            // 1. Get the file extension (e.g., "mp3")
            const fileExt = demoFile.name.split('.').pop();
            // 2. Create a clean, unique name using a timestamp
            const cleanFileName = `${Date.now()}.${fileExt}`;
            // 3. Create the final, safe path using the actor's ID as the folder
            const filePath = `${actorData.id}/${cleanFileName}`;
            // --- END OF FIX ---

            // 2. Upload to 'demos' storage bucket with the new safe path
            const { error: uploadError } = await supabase.storage.from('demos').upload(filePath, demoFile);
            if (uploadError) throw uploadError;

            // 3. Get the public URL
            const { data: urlData } = supabase.storage.from('demos').getPublicUrl(filePath);
            if (!urlData) throw new Error("Could not get public URL.");

            // 4. Insert record into the 'demos' database table
            const { data: newDemoData, error: insertError } = await supabase
                .from('demos')
                .insert({
                    actor_id: actorData.id,
                    demo_url: urlData.publicUrl,
                    title: newDemo.title,
                    language: newDemo.language,
                    style_tag: newDemo.style_tag,
                })
                .select()
                .single();

            if (insertError) throw insertError;
            
            setDemos(prev => [newDemoData as Demo, ...prev]);
            setNewDemo({ title: '', language: '', style_tag: '' });
            setDemoFile(null);
            (document.getElementById('demo-file-input') as HTMLInputElement).value = ""; // Reset file input
            setDemoMessage("Demo uploaded successfully!");

        } catch (error) {
            const err = error as Error;
            setDemoMessage(`Error: ${err.message}`);
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleMainDemoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !actorData.id) return;

        try {
            setUploadingMainDemo(true);
            setMessage("Uploading main demo...");

            // --- THIS IS THE FIX ---
            // 1. Get the file extension
            const fileExt = file.name.split('.').pop();
            // 2. Create a clean, unique path *inside* the actor's personal folder
            const filePath = `${actorData.id}/main-demo.${fileExt}`;
            // --- END OF FIX ---

            // We upload to the 'demos' bucket, as it's our public audio bucket
            const { error: uploadError } = await supabase.storage
                .from('demos')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get the public URL with a cache-busting timestamp
            const { data: urlData } = supabase.storage.from('demos').getPublicUrl(filePath);
            const newDemoUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;

            // Update the 'MainDemoURL' column in the 'actors' table
            const { error: updateError } = await supabase
                .from('actors')
                .update({ MainDemoURL: newDemoUrl })
                .eq('id', actorData.id);

            if (updateError) throw updateError;
            
            setActorData(prev => ({ ...prev, MainDemoURL: newDemoUrl }));
            setMessage("Main demo updated successfully!");

        } catch (error) {
            const err = error as Error;
            setMessage(`Error: ${err.message}`);
        } finally {
            setUploadingMainDemo(false);
        }
    };


    const handleDemoDelete = async (demoId: string, demoUrl: string) => {
        if (!window.confirm("Are you sure you want to delete this demo?")) return;
        
        try {
            // Extract file path from URL
            const filePath = new URL(demoUrl).pathname.split('/demos/')[1];
            
            // Delete file from storage
            const { error: storageError } = await supabase.storage.from('demos').remove([filePath]);
            if(storageError) throw storageError;

            // Delete record from database
            const { error: dbError } = await supabase.from('demos').delete().eq('id', demoId);
            if(dbError) throw dbError;

            setDemos(prev => prev.filter(d => d.id !== demoId));
            setMessage("Demo deleted successfully.");

        } catch (error) {
            const err = error as Error;
            setMessage(`Error: ${err.message}`);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('Saving...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const cleanedSlug = (actorData.slug || '').toLowerCase().replace(/\s+/g, '-');


        // Include bank details in the update payload
        const updatePayload = {
            ActorName: actorData.ActorName,
            Gender: actorData.Gender,
            Language: actorData.Language,
            slug: cleanedSlug,
            Tags: actorData.Tags,
            BaseRate_per_Word: actorData.BaseRate_per_Word,
            WebMultiplier: actorData.WebMultiplier,
            BroadcastMultiplier: actorData.BroadcastMultiplier,
            revisions_allowed: actorData.revisions_allowed,
            bio: actorData.bio,
            // Add bank details
            bank_name: actorData.bank_name,
            bank_holder_name: actorData.bank_holder_name,
            bank_iban: actorData.bank_iban,
            bank_account_number: actorData.bank_account_number,
            // DO NOT update direct_payment flags here, only bank details
        };

        const { error } = await supabase
            .from('actors')
            .update(updatePayload) // Use the payload            
            .eq('user_id', user.id);

        if (error) {
            // Check for the specific "unique constraint" error
            if (error.message.includes('duplicate key value violates unique constraint "actors_slug_key"')) {
                setMessage('Error: This URL slug is already taken. Please choose another.');
            } else {
                setMessage(`Error: ${error.message}`);
            }
        } else {
            // Update local state with the cleaned slug
            setActorData(prev => ({ ...prev, slug: cleanedSlug }));
            setMessage('Profile updated successfully!');
    }
};
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
         // Allow clearing bank fields back to null if desired, otherwise treat as string
        setActorData({ ...actorData, [name]: value });
    };

    // --- NEW: Function to handle adding/removing tags ---
    const handleTagToggle = (tagToToggle: string) => {
        const currentTags = actorData.Tags ? actorData.Tags.split(',').map(t => t.trim()) : [];
        const newTags = currentTags.includes(tagToToggle)
            ? currentTags.filter(t => t !== tagToToggle) // If tag exists, remove it
            : [...currentTags, tagToToggle]; // If tag doesn't exist, add it
            setActorData({ ...actorData, Tags: newTags.join(', ') });
            };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/actor-login');
    };


    // --- NEW: Function to handle profile picture upload ---
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            // Use the user's ID as the file name. This ensures it's unique and can be replaced.
            const filePath = user.id;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true }); // upsert: true is the magic for replacing the file

            if (uploadError) throw uploadError;

            // Get the public URL of the newly uploaded image
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const newAvatarUrl = urlData.publicUrl;

            // Update the URL in the actors table
            const { error: updateError } = await supabase
                .from('actors')
                .update({ HeadshotURL: newAvatarUrl })
                .eq('user_id', user.id);

            if (updateError) throw updateError;
            
            // Update the local state to show the new image instantly
            setActorData(prev => ({ ...prev, HeadshotURL: newAvatarUrl }));
            setMessage("Profile picture updated!");

        } catch (error) {
            const err = error as Error;
            setMessage(`Error: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };
    // duplicate handleMainDemoUpload removed — using the earlier handleMainDemoUpload implementation above


    // --- NEW: Handler for Actor to Confirm Payment ---
    // This function will be passed to the modal
    const handleActorConfirmPayment = async (orderId: string, clientEmail: string, clientName: string, orderIdString: string) => {
        setMessage(''); // Clear message
        try {
            const { error: updateError } = await supabase
                .from('orders')
                .update({ status: 'In Progress' })
                .eq('id', orderId)
                .eq('status', 'Awaiting Actor Confirmation'); // Ensure correct status

            if (updateError) throw updateError;

            setMessage('Payment confirmed! The order is now In Progress.');
            fetchData(); // Refresh all data
            setSelectedOrder(null); // Close the modal

            // --- Send notification email to Client that work has started ---
            const emailParams = {
                clientName: clientName,
                clientEmail: clientEmail,
                orderIdString: orderIdString,
                actorName: actorData.ActorName // Actor confirms, so use actorData
            };
            
            // You need to create this template in EmailJS
            emailjs.send(
                'service_r3pvt1s', // Your Service ID
                'YOUR_CLIENT_WORK_STARTED_TEMPLATE_ID', // Replace!
                emailParams,
                'I51tDIHsXYKncMQpO' // Your Public Key
            ).catch(err => console.error("Failed to send 'work started' email:", err));

        } catch (error) {
            const err = error as Error;
            console.error("Error confirming payment:", err);
            setMessage(`Error confirming payment: ${err.message}`);
        }
    };
    // --- END Handler ---



    if (loading && !selectedOrder) { // Only show full-page loader initially
        return <div className="min-h-screen bg-slate-900 text-white text-center p-8">Loading Dashboard...</div>;
    }

    // --- NEW: Filter orders based on the active tab ---
    const filteredOrders = orders.filter(order => {
        if (activeTab === 'active') {
            // Awaiting Actor Confirmation is an "active" status
            return order.status !== 'Completed' && order.status !== 'Cancelled';
        }
        return order.status === 'Completed';
    });

    // --- NEW: Handler for saving a new recording ---
    const handleSaveRecording = async (audioFile: File, recordingName: string) => {
        if (!actorData.id) return;
        
        setIsSavingRecording(true);
        setMessage('');

        try {
            // 1. Upload the raw audio file to a 'recordings' bucket
            const fileExt = audioFile.name.split('.').pop() || 'webm';
            const filePath = `${actorData.id}/${recordingName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.${fileExt}`;

            // Create 'recordings' bucket in Supabase Storage (public or private)
            // For now, let's assume private and actors can read their own
            const { error: uploadError } = await supabase.storage
                .from('recordings') // *** You must create this bucket! ***
                .upload(filePath, audioFile);
            if (uploadError) throw uploadError;

            // 2. Get the *non-public* URL (or public if you made it public)
            // Since this is a library, let's assume it's private.
            // For simplicity, let's make the 'recordings' bucket PUBLIC for now.
            const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(filePath);

            // 3. Insert into the actor_recordings table
            const { data: newRecording, error: insertError } = await supabase
                .from('actor_recordings')
                .insert({
                    actor_id: actorData.id,
                    name: recordingName,
                    raw_audio_url: urlData.publicUrl, // Store the public URL
                    status: 'raw'
                })
                .select()
                .single();
            
            if (insertError) throw insertError;

            setRecordings(prev => [newRecording as ActorRecording, ...prev]); // Add to top of list
            setMessage('Recording saved to library!');
            setIsRecordingModalOpen(false);

        } catch (error) {
            const err = error as Error;
            console.error("Error saving recording:", err);
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsSavingRecording(false);
        }
    };
    // ---

    // --- NEW: Handler for cleaning audio ---
    const handleCleanAudio = async (recordingId: string) => {
        setCleaningId(recordingId); // Set loading state for this specific recording
        setMessage('');

        try {
            // Optimistically update UI
            setRecordings(prev => prev.map(r => 
                r.id === recordingId ? { ...r, status: 'cleaning' } : r
            ));

            const { data: cleanedRecording, error: functionError } = await supabase.functions.invoke(
                'clean-audio',
                { body: { recordingId } }
            );

            if (functionError) throw functionError;
            if (cleanedRecording.error) throw new Error(cleanedRecording.error);

            // On success, update the list with the final 'cleaned' data
            setRecordings(prev => prev.map(r => 
                r.id === recordingId ? cleanedRecording : r
            ));
            setMessage('Audio cleaning complete!');

        } catch (error) {
            const err = error as Error;
            console.error("Error cleaning audio:", err);
            setMessage(`Error: ${err.message}`);
            // Revert UI on error
            setRecordings(prev => prev.map(r => 
                r.id === recordingId ? { ...r, status: 'error' } : r // Show an error status
            ));
        } finally {
            setCleaningId(null); // Clear loading state
        }
    };
    // ---

    return (
        <div className="min-h-screen bg-slate-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                 {/* ... Header (Your Dashboard, Logout Button) ... */}
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Your Dashboard</h1>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold">Log Out</button>
                </div>


                {/* --- Profile Management Section --- */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 mb-8">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-full flex justify-between items-center p-6"
                    >
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Settings size={20}/> Manage Your Profile
                        </h2>
                        {isProfileOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                    </button>

                    {/* --- Conditionally Render Profile Form --- */}
                    {isProfileOpen && (
                    <div className="p-6 pt-0 border-t border-slate-700"> {/* Added border */}
                        {/* --- Avatar Upload UI --- */}
                        <div className="flex flex-col items-center gap-4 mb-6 pt-6 border-b border-slate-700 pb-6">
                            {/* ... img, label, input for avatar ... */}
                            <img
                                src={actorData.HeadshotURL || 'https://via.placeholder.com/150'}
                                alt="Profile"
                                className="w-32 h-32 rounded-full object-cover border-4 border-slate-600"
                            />
                            <label htmlFor="avatar-upload" className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-sm">
                                {uploading ? 'Uploading...' : 'Change Picture'}
                            </label>
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/png, image/jpeg"
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                            />
                        </div>




                        {/* --- Profile Form with Tabs --- */}
                        <form onSubmit={handleUpdate} className="pt-6">
                            {/* --- Tab Buttons --- */}
                            <div className="mb-6 flex border-b border-slate-600">
                                {/* Basic Info Tab Button */}
                                <button
                                    type="button"
                                    onClick={() => setActiveProfileTab('info')}
                                    className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-medium transition-colors ${
                                        activeProfileTab === 'info'
                                        ? 'border-b-2 border-purple-500 text-white'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                     <User size={16}/> Basic Info
                                </button>
                                 {/* Rates Tab Button */}
                                <button
                                    type="button"
                                    onClick={() => setActiveProfileTab('rates')}
                                     className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-medium transition-colors ${
                                        activeProfileTab === 'rates'
                                        ? 'border-b-2 border-purple-500 text-white'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                     <DollarSign size={16}/> Rates & Revisions
                                </button>
                                 {/* NEW Payout Settings Tab Button */}
                                <button
                                    type="button"
                                    onClick={() => setActiveProfileTab('payout')}
                                     className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-medium transition-colors ${
                                        activeProfileTab === 'payout'
                                        ? 'border-b-2 border-purple-500 text-white'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                     <Banknote size={16}/> Payout Settings
                                </button>
                            </div>

                            {/* --- Tab Content --- */}
                            <div className="space-y-6"> {/* Common spacing for fields */}
                                {/* === Basic Info Tab === */}
                                {activeProfileTab === 'info' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                        <div className="md:col-span-2">
                                            <label htmlFor="ActorName" className="block text-sm font-medium text-slate-300">Display Name</label>
                                            <input type="text" name="ActorName" id="ActorName" value={actorData.ActorName || ''} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" />
                                        </div>
                                         <div>
                                            <label htmlFor="slug" className="block text-sm font-medium text-slate-300">Username / URL</label>
                                            <input type="text" name="slug" id="slug" value={actorData.slug || ''} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" placeholder="e.g., your-name"/>
                                        </div>
                                         <div>
                                            <label htmlFor="Gender" className="block text-sm font-medium text-slate-300">Gender</label>
                                            <select name="Gender" id="Gender" value={actorData.Gender || ''} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white">
                                                <option value="" disabled>Select gender...</option>
                                                {genderOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                            </select>
                                        </div>
                                         <div>
                                            <label htmlFor="Language" className="block text-sm font-medium text-slate-300">Primary Language</label>
                                            <select name="Language" id="Language" value={actorData.Language || ''} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white">
                                                <option value="" disabled>Select language...</option>
                                                {languageOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                            </select>
                                        </div>
                                         <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-300">Tags (Select all that apply)</label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {tagOptions.map(tag => {
                                                    const isSelected = (actorData.Tags || '').includes(tag);
                                                    return (
                                                        <button type="button" key={tag} onClick={() => handleTagToggle(tag)}
                                                            className={`px-3 py-1 rounded-full text-sm font-semibold transition ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
                                                        > {tag} </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                         <div className="md:col-span-2">
                                            <label htmlFor="bio" className="block text-sm font-medium text-slate-300">Your Bio</label>
                                            <textarea name="bio" id="bio" rows={4} value={actorData.bio || ''} onChange={handleInputChange}
                                                className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white"
                                                placeholder="Tell clients about your voice..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* === Rates & Revisions Tab === */}
                                {activeProfileTab === 'rates' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                         <div className="md:col-span-2">
                                            <h3 className="text-lg font-semibold text-white">Your Rates (MAD)</h3>
                                        </div>
                                        <div>
                                            <label htmlFor="BaseRate_per_Word" className="block text-sm font-medium text-slate-300">Base Rate per Word</label>
                                            <input type="number" step="0.01" name="BaseRate_per_Word" id="BaseRate_per_Word" value={actorData.BaseRate_per_Word || 0} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" />
                                        </div>
                                        <div>
                                            <label htmlFor="WebMultiplier" className="block text-sm font-medium text-slate-300">Web Usage Multiplier</label>
                                            <input type="number" step="0.1" name="WebMultiplier" id="WebMultiplier" value={actorData.WebMultiplier || 1} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" />
                                        </div>
                                        <div>
                                            <label htmlFor="BroadcastMultiplier" className="block text-sm font-medium text-slate-300">Broadcast Multiplier</label>
                                            <input type="number" step="0.1" name="BroadcastMultiplier" id="BroadcastMultiplier" value={actorData.BroadcastMultiplier || 1} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" />
                                        </div>
                                        <div>
                                            <label htmlFor="revisions_allowed" className="block text-sm font-medium text-slate-300">Revisions Offered</label>
                                            <input type="number" name="revisions_allowed" id="revisions_allowed" value={actorData.revisions_allowed || 2} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white"/>
                                        </div>
                                    </div>
                                )}

                            {/* === NEW Payout Settings Tab === */}
                                {activeProfileTab === 'payout' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* Bank Details Section */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Bank Account Details</h3>
                                            <p className="text-sm text-slate-400 mb-4">Enter the bank details where you wish to receive direct payments once approved.</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                 {/* Bank Name */}
                                                <div>
                                                    <label htmlFor="bank_name" className="block text-sm font-medium text-slate-300">Bank Name</label>
                                                    <input type="text" name="bank_name" id="bank_name" value={actorData.bank_name || ''} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" placeholder="e.g., Attijariwafa Bank"/>
                                                </div>
                                                 {/* Holder Name */}
                                                 <div>
                                                    <label htmlFor="bank_holder_name" className="block text-sm font-medium text-slate-300">Account Holder Name</label>
                                                    <input type="text" name="bank_holder_name" id="bank_holder_name" value={actorData.bank_holder_name || ''} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" placeholder="Full name on account"/>
                                                </div>
                                                 {/* IBAN */}
                                                 <div className="md:col-span-2">
                                                    <label htmlFor="bank_iban" className="block text-sm font-medium text-slate-300">IBAN</label>
                                                    <input type="text" name="bank_iban" id="bank_iban" value={actorData.bank_iban || ''} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" placeholder="MA..."/>
                                                </div>
                                                 {/* Account Number */}
                                                 <div className="md:col-span-2">
                                                    <label htmlFor="bank_account_number" className="block text-sm font-medium text-slate-300">Account Number (RIB)</label>
                                                    <input type="text" name="bank_account_number" id="bank_account_number" value={actorData.bank_account_number || ''} onChange={handleInputChange} className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white" placeholder="Full account number"/>
                                                </div>
                                            </div>
                                        </div>

                                                                             {/* --- Direct Payment Status Section --- */}
                                    <div className="mt-8 pt-6 border-t border-slate-700">
                                        <h3 className="text-lg font-semibold text-white mb-4">Direct Payment Eligibility</h3>
                                        {eligibilityLoading ? (
                                            <p className="text-sm text-slate-400">Loading eligibility status...</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Progress Display */}
                                                <div className="flex flex-col sm:flex-row gap-4">
                                                    <div className="flex-1 bg-slate-700/50 p-3 rounded-lg text-center">
                                                         <p className="text-xs text-slate-400 uppercase tracking-wider">Completed Orders</p>
                                                         <p className="text-xl font-bold mt-1">
                                                              {completedOrderCount} / <span className="text-slate-400">1</span>
                                                          </p>
                                                     </div>
                                                     <div className="flex-1 bg-slate-700/50 p-3 rounded-lg text-center">
                                                          <p className="text-xs text-slate-400 uppercase tracking-wider">Average Rating</p>
                                                           <p className="text-xl font-bold mt-1">
                                                               {averageRating?.toFixed(1) ?? 'N/A'} / <span className="text-slate-400">3.0+</span>
                                                          </p>
                                                      </div>
                                                 </div>

                                                 {/* Status & Action */}
                                                 <div className="p-4 bg-slate-900/50 rounded-lg text-center">
                                                     {(() => {
                                                         const isEligible = completedOrderCount >= 1 && (averageRating ?? 0) > 3.0;

                                                         if (actorData.direct_payment_enabled) {
                                                             return <p className="text-green-400 font-semibold">✅ Direct Payments Approved & Enabled</p>;
                                                         } else if (actorData.direct_payment_requested) {
                                                              return <p className="text-yellow-400 font-semibold">⏳ Request Pending Admin Approval</p>;
                                                         } else if (isEligible) {
                                                             // Eligible but not requested/approved yet - Show Button
                                                              return (
                                                                  <>
                                                                      <p className="text-blue-400 font-semibold mb-3">🎉 You are eligible for Direct Payments!</p>
                                                                      <button
                                                                          type="button"
                                                                          onClick={handleRequestDirectPayment}
                                                                          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-semibold transition-colors"
                                                                      >
                                                                          Request Admin Approval
                                                                      </button>
                                                                  </>
                                                              );
                                                         } else {
                                                              // Not eligible yet
                                                             return <p className="text-slate-400">Meet the requirements above to request direct payments.</p>;
                                                         }
                                                     })()}
                                                  </div>
                                            </div>
                                        )}
                                     </div>
                                     {/* --- END Status Section --- */}
                                 </div>
                             )}
                         </div>


                            {/* --- Save Button (Outside Tabs) --- */}
                            <div className="mt-8 pt-6 border-t border-slate-700 text-right">
                               <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold">Save Changes</button>
                            </div>
                        </form>
                        {message && <p className="mt-4 text-center text-sm text-green-400">{message}</p>}
                        </div>
                    )}
                </div>

                {/* --- NEW: Manage Demos Section --- */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 mb-8">
                    <button onClick={() => setIsDemosOpen(!isDemosOpen)} className="w-full flex justify-between items-center p-6">
                        <h2 className="text-2xl font-bold text-white">Manage Your Demos</h2>
                        {isDemosOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                    </button>

                    {isDemosOpen && (
                        <div className="p-6 pt-0 border-t border-slate-700">
                            <div className="pt-6 mb-6 border-b border-slate-700 pb-6">
                                <h3 className="text-lg font-semibold text-white">Your Main Demo (for your card)</h3>
                                <p className="text-sm text-slate-400 mb-3">This is the primary audio sample clients hear on the main roster page.</p>
                                {actorData.MainDemoURL && (
                                    <audio controls src={actorData.MainDemoURL} className="w-full h-10 mb-2"></audio>
                                )}
                                <label htmlFor="main-demo-upload" className="cursor-pointer text-sm w-full inline-block text-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-md">
                                    {uploadingMainDemo ? 'Uploading...' : 'Upload & Replace Main Demo'}
                                </label>
                                <input type="file" id="main-demo-upload" className="hidden" accept="audio/*" onChange={handleMainDemoUpload} disabled={uploadingMainDemo} />
                            </div>
                            {/* Upload Form */}
                            <form onSubmit={handleDemoUpload} className="space-y-4 mb-8">
                                <h3 className="text-lg font-semibold text-white pt-4">Upload New Demo</h3>
                                <input type="text" name="title" placeholder="Demo Title (e.g., 'Corporate Narration')" value={newDemo.title} onChange={handleDemoInputChange} required className="w-full bg-slate-700 p-2 rounded-md" />
                                <div className="grid grid-cols-2 gap-4">
                                    <select name="language" value={newDemo.language} onChange={handleDemoInputChange} required className="w-full bg-slate-700 p-2 rounded-md">
                                        <option value="">Select Language...</option>
                                        {languageOptions.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                    </select>
                                    <select name="style_tag" value={newDemo.style_tag} onChange={handleDemoInputChange} required className="w-full bg-slate-700 p-2 rounded-md">
                                        <option value="">Select Style...</option>
                                        {tagOptions.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                                    </select>
                                </div>
                                <input type="file" accept="audio/*" onChange={handleFileChange} required className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                                <button type="submit" disabled={uploading} className="w-full py-2 bg-purple-600 rounded-md font-semibold disabled:opacity-50">{uploading ? 'Uploading...' : 'Upload Demo'}</button>
                            </form>

                            {/* Existing Demos List */}
                            <h3 className="text-lg font-semibold text-white mb-4 border-t border-slate-700 pt-4">Your Uploaded Demos</h3>
                            <div className="space-y-3">
                                {demos.length > 0 ? demos.map(demo => (
                                    <div key={demo.id} className="bg-slate-700/50 p-3 rounded-md flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Music size={16} className="text-slate-400" />
                                            <div>
                                                <p className="font-semibold text-white">{demo.title}</p>
                                                <p className="text-xs text-slate-400">{demo.language} | {demo.style_tag}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDemoDelete(demo.id, demo.demo_url)} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )) : <p className="text-slate-500 text-sm">You haven't uploaded any demos yet.</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- NEW: Recording Library Section --- */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 mb-8">
                    <div className="flex justify-between items-center p-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <AudioLines size={20}/> My Recordings Library
                        </h2>
                        <button
                            onClick={() => setIsRecordingModalOpen(true)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md text-sm inline-flex items-center gap-2"
                        >
                            <Plus size={16} /> Record New
                        </button>
                    </div>
                    <div className="p-6 pt-0 border-t border-slate-700">
                        <div className="space-y-3 mt-6">
                            {recordings.length === 0 && (
                                <p className="text-slate-500 text-sm text-center py-4">Your recording library is empty.</p>
                            )}
                            {recordings.map(rec => (
                                <div key={rec.id} className="bg-slate-700/50 p-3 rounded-md">
                                    <p className="font-semibold text-white">{rec.name}</p>
                                    <p className="text-xs text-slate-400 mb-2">
                                        Recorded: {new Date(rec.created_at).toLocaleDateString()}
                                    </p>
                                    
                                    {/* Raw Audio */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-400">Raw Audio:</label>
                                        <audio controls src={rec.raw_audio_url} className="w-full h-9" />
                                    </div>

{/* Cleaned Audio (or button) */}
                                    <div className="mt-3 pt-3 border-t border-slate-600 space-y-1">
                                        {rec.status === 'cleaned' && rec.cleaned_audio_url ? (
                                            <>
                                                <label className="text-xs font-semibold text-green-400">Cleaned Audio (AI):</label>
                                                <audio controls src={rec.cleaned_audio_url} className="w-full h-9" />
                                            </>
                                        ) : rec.status === 'cleaning' ? (
                                            <button className="w-full text-sm p-2 bg-slate-600 text-yellow-400 rounded-md animate-pulse" disabled>
                                                <Brain size={16} className="inline-block mr-2 animate-spin" />
                                                Cleaning in progress...
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleCleanAudio(rec.id)}
                                                disabled={cleaningId === rec.id} // Disable button if it's the one cleaning
                                                className="w-full text-sm p-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <Brain size={16} /> 
                                                {rec.status === 'error' ? 'Cleaning Failed, Try Again' : 'Clean Audio (AI)'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- THIS IS THE MODIFIED ORDERS SECTION --- */}
                <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Your Orders</h2>
                        {/* Tab Buttons */}
                        <div className="flex gap-2 p-1 bg-slate-900 rounded-lg">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`px-4 py-1 rounded-md text-sm font-semibold transition ${activeTab === 'active' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setActiveTab('completed')}
                                className={`px-4 py-1 rounded-md text-sm font-semibold transition ${activeTab === 'completed' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                            >
                                Completed
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map(order => (
                                <button
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                   className={`w-full bg-slate-700 p-4 rounded-lg text-left hover:bg-slate-600 transition ${
                                        order.status === 'Awaiting Actor Confirmation' ? 'ring-2 ring-green-500 shadow-lg' : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-white">Order #{order.order_id_string}</p>
                                            <p className="text-sm text-slate-400">Client: {order.client_name}</p>
                                        </div>
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                            order.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                                            order.status === 'Awaiting Actor Confirmation' ? 'bg-green-500/20 text-green-400 animate-pulse' : // Highlight green
                                            'bg-yellow-500/20 text-yellow-400' // Default "in-progress"
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="text-slate-400 text-center py-4">
                                You have no {activeTab} orders.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- NEW: Recording Modal --- */}
            {isRecordingModalOpen && (
                <RecordingModal 
                    onClose={() => setIsRecordingModalOpen(false)}
                    onSave={handleSaveRecording}
                    isSaving={isSavingRecording}
                />
            )}

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={fetchData} 
                    onActorConfirmPayment={handleActorConfirmPayment} // <-- Pass the new handler
                />
            )}

        </div>

    ); 
}; 

export default ActorDashboardPage;