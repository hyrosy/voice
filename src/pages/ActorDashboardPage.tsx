
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import OrderDetailsModal from '../components/OrderDetailsModal';
// Import icons needed for tabs if desired (e.g., User, DollarSign)
import { ChevronDown, ChevronUp, Music, Trash2, UploadCloud, User, DollarSign, Settings, Banknote, CheckCircle, AudioLines, Plus, Play, Brain, RefreshCw } from 'lucide-react';
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
    const pollingIntervalRef = useRef<Map<string, number>>(new Map()); // <-- ADD THIS

    // ... other state variables
    const [isLibraryOpen, setIsLibraryOpen] = useState(true); // Library open by default
    const [activeLibraryTab, setActiveLibraryTab] = useState<'recordings' | 'upload'>('recordings');
    const [isDeletingRecording, setIsDeletingRecording] = useState<string | null>(null); // Track which recording is being deleted
    const [uploadingRecordingFile, setUploadingRecordingFile] = useState<File | null>(null);
    const [uploadingRecordingName, setUploadingRecordingName] = useState('');
    const [isUploading, setIsUploading] = useState(false); // General upload loading state
    // ... rest of state
    


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

    // --- NEW: Realtime listener for recording updates ---
useEffect(() => {
    if (!actorData.id) return; // Don't subscribe until actor is loaded

    const channel = supabase.channel(`actor-recordings-${actorData.id}`)
        .on('postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'actor_recordings',
                filter: `actor_id=eq.${actorData.id}` 
            },
            (payload) => {
                console.log('Realtime update received:', payload.new);
                const updatedRecording = payload.new as ActorRecording;

                // Update the local state with the new data from the webhook
                setRecordings(prev => 
                    prev.map(r => r.id === updatedRecording.id ? updatedRecording : r)
                );

                // If the job finished (cleaned or error), clear the loading spinner
                if (updatedRecording.id === cleaningId && (updatedRecording.status === 'cleaned' || updatedRecording.status === 'error')) {
                    setCleaningId(null); 

                    if(updatedRecording.status === 'cleaned') {
                        setMessage(`Recording "${updatedRecording.name}" is clean!`);
                    }
                }
            }
        )
        .subscribe();

    // Cleanup
    return () => {
        supabase.removeChannel(channel);
    };
}, [actorData.id, cleaningId]); // Add cleaningId as dependency

// ... after your existing useEffect hooks ...

// --- NEW: useEffect to start and stop polling ---
useEffect(() => {
  // Clear any existing intervals when the component unmounts
  const intervalMap = pollingIntervalRef.current;
  return () => {
    intervalMap.forEach(intervalId => clearInterval(intervalId));
  };
}, []);

// This effect runs when the `cleaningId` state is set
useEffect(() => {
  if (cleaningId) {
    // Function to poll the status
    const poll = async () => {
      console.log(`Polling status for recording: ${cleaningId}`);
      try {
        const { data, error } = await supabase.functions.invoke(
          'poll-audo-status',
          { body: { recordingId: cleaningId } }
        );

        if (error) throw error;

        const audoStatus = data.status;
        console.log(`Audo status: ${audoStatus}`);

        // If job is done, stop polling
        if (audoStatus === 'succeeded' || audoStatus === 'failed') {
          const intervalId = pollingIntervalRef.current.get(cleaningId);
          if (intervalId) {
            clearInterval(intervalId);
            pollingIntervalRef.current.delete(cleaningId);
          }
          // The real-time listener will handle the UI update
        }
      } catch (err) {
        console.error("Polling error:", err);
        // Stop polling on error
        const intervalId = pollingIntervalRef.current.get(cleaningId);
        if (intervalId) {
          clearInterval(intervalId);
          pollingIntervalRef.current.delete(cleaningId);
        }
      }
    };

    // Start polling immediately, then set an interval
    poll();
    const intervalId = setInterval(poll, 10000); // Poll every 10 seconds
    pollingIntervalRef.current.set(cleaningId, intervalId as unknown as number);
  }

// We only want this to run when cleaningId changes
}, [cleaningId]);

// --- NEW: Handler for Direct Payment Request ---
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

    // --- UPDATED: Handler for cleaning audio ---
const handleCleanAudio = async (recordingId: string) => {
  setMessage('');
  let jobIdFromFunction: string | null = null; // Variable to store the jobId

  try {
    // Optimistically update UI
    setRecordings(prev => prev.map(r => 
        r.id === recordingId ? { ...r, status: 'cleaning' } : r
    ));

    // *** 1. Await the function result ***
    const { data: responseData, error: functionError } = await supabase.functions.invoke(
        'clean-audio',
        { body: { recordingId } }
    );

    if (functionError) throw functionError; 
    if (responseData.error) throw new Error(responseData.error); 

    // *** 2. Get the jobId from the response ***
    jobIdFromFunction = responseData.jobId; 
    if (!jobIdFromFunction) throw new Error("Function did not return a jobId.");

    setMessage('Cleaning job started! This may take a few seconds...');

    // *** 3. Set cleaningId AFTER getting jobId ***
    // This will trigger the polling useEffect
    setCleaningId(recordingId); 

  } catch (error) {
    const err = error as Error;
    console.error("Error starting clean audio job:", err);
    setMessage(`Error: ${err.message}`);
    // Revert UI on error
    setRecordings(prev => prev.map(r => 
        r.id === recordingId ? { ...r, status: 'error' } : r // Or keep original status
    ));

    // Ensure cleaningId is null if the start fails
    setCleaningId(null); 
  }
};

const handleDeleteRecording = async (recording: ActorRecording) => {
    if (!actorData.id) return;
    if (!window.confirm(`Are you sure you want to delete "${recording.name}"? This cannot be undone.`)) return;

    setIsDeletingRecording(recording.id); // Set loading state for this item
    setMessage('');

    try {
        const filesToDelete: string[] = [];

        // Extract file path from raw_audio_url
        if (recording.raw_audio_url) {
            try {
                const rawPath = new URL(recording.raw_audio_url).pathname.split('/recordings/')[1];
                if (rawPath) filesToDelete.push(rawPath);
            } catch (e) { console.error("Could not parse raw_audio_url:", e); }
        }
        const { data: { publicUrl: storageBaseUrl } } = supabase.storage.from('recordings').getPublicUrl('');
        // Remove the trailing slash if present
        const baseUrl = storageBaseUrl.endsWith('/') ? storageBaseUrl.slice(0, -1) : storageBaseUrl;
        // Extract file path from cleaned_audio_url
        if (recording.cleaned_audio_url) {
                 try {
                    // Cleaned URLs might be from Audo.ai or your storage - adjust if needed
                    // Check if the URL starts with your Supabase storage base URL
                    if (recording.cleaned_audio_url.startsWith(baseUrl)) { // <-- CORRECTED CHECK
                       // Construct the path relative to the bucket
                       const urlObject = new URL(recording.cleaned_audio_url);
                       const pathParts = urlObject.pathname.split('/'); 
                       // Find the index of your bucket name and take everything after it
                       const bucketIndex = pathParts.findIndex(part => part === 'recordings'); 
                       if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
                           const cleanedPath = pathParts.slice(bucketIndex + 1).join('/');
                           filesToDelete.push(cleanedPath);
                       } else {
                           console.warn("Could not extract path from cleaned_audio_url:", recording.cleaned_audio_url);
                       }
                    } else {
                       console.log("Skipping deletion of external cleaned URL:", recording.cleaned_audio_url);
                    }
                 } catch (e) { console.error("Could not parse cleaned_audio_url:", e); }
            }

        // 1. Delete files from storage (if any paths were found)
        if (filesToDelete.length > 0) {
            console.log("Attempting to delete storage files:", filesToDelete);
            const { error: storageError } = await supabase.storage
                .from('recordings') // Make sure this matches your bucket name
                .remove(filesToDelete);
            if (storageError) {
                // Log error but continue to delete DB record
                console.error("Error deleting storage files (continuing deletion):", storageError);
                setMessage(`Warning: Could not delete associated files, but removing record.`);
            }
        } else {
             console.log("No storage files to delete or URLs were unparsable/external.");
        }


        // 2. Delete the record from the database
        const { error: dbError } = await supabase
            .from('actor_recordings')
            .delete()
            .eq('id', recording.id)
            .eq('actor_id', actorData.id); // Security check

        if (dbError) throw dbError;

        // 3. Update local state
        setRecordings(prev => prev.filter(r => r.id !== recording.id));
        setMessage(`Recording "${recording.name}" deleted successfully.`);

    } catch (error) {
        const err = error as Error;
        console.error("Error deleting recording:", err);
        setMessage(`Error deleting recording: ${err.message}`);
    } finally {
        setIsDeletingRecording(null); // Clear loading state
    }
};

const handleRecordingFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingRecordingFile || !uploadingRecordingName.trim() || !actorData.id) {
        setMessage("Please select an audio file and provide a name.");
        return;
    }

    setIsUploading(true);
    setMessage('');

    try {
        // Logic similar to handleSaveRecording, but using the uploaded file
        const fileExt = uploadingRecordingFile.name.split('.').pop() || 'tmp';
        const filePath = `${actorData.id}/${uploadingRecordingName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('recordings')
            .upload(filePath, uploadingRecordingFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(filePath);
        if (!urlData) throw new Error("Could not get public URL for uploaded recording.");


        const { data: newRecording, error: insertError } = await supabase
            .from('actor_recordings')
            .insert({
                actor_id: actorData.id,
                name: uploadingRecordingName.trim(),
                raw_audio_url: urlData.publicUrl,
                status: 'raw'
            })
            .select()
            .single();

        if (insertError) throw insertError;

        setRecordings(prev => [newRecording as ActorRecording, ...prev]);
        setMessage(`Recording "${uploadingRecordingName.trim()}" uploaded successfully!`);

        // Reset form and switch tab
        setUploadingRecordingFile(null);
        setUploadingRecordingName('');
        setActiveLibraryTab('recordings');
        // Reset the file input visually
        const fileInput = document.getElementById('recording-file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = "";


    } catch (error) {
        const err = error as Error;
        console.error("Error uploading recording:", err);
        setMessage(`Error uploading recording: ${err.message}`);
    } finally {
        setIsUploading(false);
    }
};

const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setUploadingRecordingFile(e.target.files[0]);
         // Optionally prefill name based on file name (without extension)
        if (!uploadingRecordingName) {
           setUploadingRecordingName(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
        }
    } else {
        setUploadingRecordingFile(null);
    }
};

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

                {/* --- UPDATED: Recording Library Section (Accordion + Tabs) --- */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 mb-8">
                    {/* Accordion Toggle Button */}
                    <button
                        onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                        className="w-full flex justify-between items-center p-6"
                    >
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <AudioLines size={20}/> My Recordings Library
                        </h2>
                        {isLibraryOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                    </button>

                    {/* Accordion Content (Tabs) */}
                    {isLibraryOpen && (
                        <div className="p-6 pt-0 border-t border-slate-700">
                            {/* Tab Buttons */}
                            <div className="flex border-b border-slate-600 mb-6">
                                <button
                                    onClick={() => setActiveLibraryTab('recordings')}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                        activeLibraryTab === 'recordings'
                                        ? 'border-b-2 border-purple-500 text-white'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    My Recordings ({recordings.length})
                                </button>
                                <button
                                    onClick={() => setActiveLibraryTab('upload')}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                        activeLibraryTab === 'upload'
                                        ? 'border-b-2 border-purple-500 text-white'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    Upload Audio
                                </button>
                                {/* "Record New" Button Moved Here */}
                                <button
                                    onClick={() => setIsRecordingModalOpen(true)}
                                    className="ml-auto px-4 py-2 my-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md text-sm inline-flex items-center gap-2 h-fit" // Adjust styling
                                >
                                    <Plus size={16} /> Record New
                                </button>
                            </div>

                            {/* Tab Content: My Recordings */}
                            {activeLibraryTab === 'recordings' && (
                                <div className="animate-in fade-in duration-300">
                                    {/* Scrollable Container */}
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {recordings.length === 0 && (
                                            <p className="text-slate-500 text-sm text-center py-4">Your recording library is empty. Record or upload audio.</p>
                                        )}
                                        {recordings.map(rec => (
                                            <div key={rec.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600/50 relative group">
                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDeleteRecording(rec)}
                                                    disabled={isDeletingRecording === rec.id}
                                                    className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-red-500 bg-slate-800 rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                                                    title="Delete Recording"
                                                >
                                                    {isDeletingRecording === rec.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>

                                                <p className="font-semibold text-white text-lg">{rec.name}</p>
                                                <p className="text-xs text-slate-400 mb-3">
                                                    Recorded: {new Date(rec.created_at).toLocaleDateString()}
                                                </p>

                                                {/* Layout for Players (Example: Grid) */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Raw Audio */}
                                                    <div className="space-y-1">
                                                        <label className="text-sm font-semibold text-slate-300 block">Raw Audio:</label>
                                                        <audio controls src={rec.raw_audio_url} className="w-full h-10" />
                                                    </div>

                                                    {/* Cleaned Audio (or button) */}
                                                    <div className="space-y-1">
                                                        {rec.status === 'cleaned' && rec.cleaned_audio_url ? (
                                                            <>
                                                                <label className="text-sm font-semibold text-green-400 block">Cleaned Audio (AI):</label>
                                                                <audio controls src={rec.cleaned_audio_url} className="w-full h-10" />
                                                            </>
                                                        ) : rec.status === 'cleaning' || cleaningId === rec.id ? (
                                                            <div className="h-full flex items-end">
                                                                <button className="w-full text-sm p-2 bg-slate-600 text-yellow-400 rounded-md animate-pulse h-10 flex items-center justify-center gap-2" disabled>
                                                                    <Brain size={16} className="animate-spin" />
                                                                    Cleaning...
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="h-full flex items-end">
                                                                <button
                                                                    onClick={() => handleCleanAudio(rec.id)}
                                                                    className="w-full text-sm p-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md flex items-center justify-center gap-2 h-10"
                                                                >
                                                                    <Brain size={16} />
                                                                    {rec.status === 'error' ? 'Cleaning Failed, Try Again' : 'Clean Audio (AI)'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tab Content: Upload Audio */}
                            {activeLibraryTab === 'upload' && (
                                <div className="animate-in fade-in duration-300">
                                    <form onSubmit={handleRecordingFileUpload} className="space-y-4 max-w-lg mx-auto">
                                        <h3 className="text-lg font-semibold text-white text-center">Upload Existing Audio File</h3>
                                        <div>
                                            <label htmlFor="recording-file-upload" className="block text-sm font-medium text-slate-300 mb-1">Audio File (MP3, WAV, etc.)</label>
                                            <input
                                                type="file"
                                                id="recording-file-upload"
                                                accept="audio/*"
                                                onChange={handleUploadFileChange}
                                                required
                                                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="uploading-recording-name" className="block text-sm font-medium text-slate-300 mb-1">Recording Name</label>
                                            <input
                                                type="text"
                                                id="uploading-recording-name"
                                                value={uploadingRecordingName}
                                                onChange={(e) => setUploadingRecordingName(e.target.value)}
                                                placeholder="Enter a name for this recording"
                                                required
                                                className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isUploading || !uploadingRecordingFile || !uploadingRecordingName.trim()}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <UploadCloud size={18} />
                                            {isUploading ? 'Uploading...' : 'Upload & Save to Library'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* --- END Recording Library Section --- */}


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