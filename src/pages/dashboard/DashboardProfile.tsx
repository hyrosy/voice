// In src/pages/dashboard/DashboardProfile.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '@/layouts/ActorDashboardLayout';

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// ---

import { Save } from 'lucide-react';

// --- Interfaces (Specific to this page) ---
// This interface now includes profile fields AND payout fields
interface ActorProfile {
  id: string;
  ActorName: string;
  bio: string;
  Gender: string;
  slug: string;
  Language: string;
  Tags: string;
  HeadshotURL?: string;
  bank_name?: string | null;
  bank_holder_name?: string | null;
  bank_iban?: string | null;
  bank_account_number?: string | null;
  direct_payment_enabled?: boolean;
  direct_payment_requested?: boolean;
}

// --- Hardcoded Options ---
const genderOptions = ["Male", "Female"];
const languageOptions = ["Arabic", "English", "French", "Spanish"];
const tagOptions = ["Warm", "Deep", "Conversational", "Corporate"];

const DashboardProfile: React.FC = () => {
  const { actorData: layoutActorData } = useOutletContext<ActorDashboardContextType>();
  
  const [profile, setProfile] = useState<Partial<ActorProfile>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Eligibility State
  const [completedOrderCount, setCompletedOrderCount] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState<boolean>(true);

  // Fetch all data needed for this page
  const fetchProfileData = useCallback(async () => {
    if (!layoutActorData.id) return;
    setLoading(true);
    setEligibilityLoading(true);
    
    // 1. Fetch profile and bank info
    const { data: fullProfile, error } = await supabase
      .from('actors')
      .select('id, ActorName, bio, Gender, slug, Language, Tags, HeadshotURL, bank_name, bank_holder_name, bank_iban, bank_account_number, direct_payment_enabled, direct_payment_requested')
      .eq('id', layoutActorData.id)
      .single();

    if (error) {
      console.error("Error fetching full profile:", error);
      setMessage(`Error: ${error.message}`);
    } else if (fullProfile) {
      setProfile(fullProfile);
    }
    setLoading(false);

    // 2. Fetch eligibility data
    try {
      const { count: orderCount } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('actor_id', layoutActorData.id).eq('status', 'Completed');
      setCompletedOrderCount(orderCount ?? 0);
      const { data: reviewsData } = await supabase.from('reviews').select('rating').eq('actor_id', layoutActorData.id);
      if (reviewsData && reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(parseFloat((totalRating / reviewsData.length).toFixed(1)));
      } else {
        setAverageRating(null);
      }
    } catch (error) {
      console.error("Error fetching eligibility data:", error);
    } finally {
      setEligibilityLoading(false);
    }
  }, [layoutActorData.id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setProfile({ ...profile, [name]: value });
  };

  const handleTagToggle = (tagToToggle: string) => {
    const currentTags = profile.Tags ? profile.Tags.split(',').map(t => t.trim()) : [];
    const newTags = currentTags.includes(tagToToggle)
      ? currentTags.filter(t => t !== tagToToggle)
      : [...currentTags, tagToToggle];
    setProfile({ ...profile, Tags: newTags.join(', ') });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile.id) return;
    setUploadingAvatar(true);
    setMessage('');
    try {
      const filePath = profile.id; // Use actor ID as file path
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newAvatarUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;

      const { error: updateError } = await supabase
        .from('actors')
        .update({ HeadshotURL: newAvatarUrl })
        .eq('id', profile.id);
      if (updateError) throw updateError;
      
      setProfile(prev => ({ ...prev, HeadshotURL: newAvatarUrl }));
      setMessage("Profile picture updated!");
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRequestDirectPayment = async () => {
    setMessage('');
    if (!profile.id) return;
    setMessage('Sending request...');
    try {
        const { error } = await supabase
            .from('actors')
            .update({ direct_payment_requested: true })
            .eq('id', profile.id);
        if (error) throw error;
        setProfile(prev => ({ ...prev, direct_payment_requested: true }));
        setMessage('Request sent successfully! An admin will review it.');
    } catch (error) {
        setMessage(`Failed to send request: ${(error as Error).message}`);
    }
  };

  // This one function now saves both profile and bank info
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.id) return;

    setIsSaving(true);
    setMessage('Saving...');
    
    const cleanedSlug = (profile.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Payload includes all fields from both tabs
    const updatePayload = {
      ActorName: profile.ActorName,
      Gender: profile.Gender,
      Language: profile.Language,
      slug: cleanedSlug,
      Tags: profile.Tags,
      bio: profile.bio,
      bank_name: profile.bank_name,
      bank_holder_name: profile.bank_holder_name,
      bank_iban: profile.bank_iban,
      bank_account_number: profile.bank_account_number,
    };

    const { error } = await supabase
      .from('actors')
      .update(updatePayload)
      .eq('id', profile.id);

    if (error) {
      if (error.message.includes('duplicate key value violates unique constraint "actors_slug_key"')) {
        setMessage('Error: This URL slug is already taken. Please choose another.');
      } else {
        setMessage(`Error: ${error.message}`);
      }
    } else {
      setProfile(prev => ({ ...prev, slug: cleanedSlug }));
      setMessage('Profile updated successfully!');
    }
    setIsSaving(false);
  };
  
  if (loading) {
     return <div className="text-center p-8 text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pt-20">
      <h1 className="text-3xl font-bold mb-6">Manage Your Profile</h1>
      {message && <div className="mb-4 p-3 bg-card border rounded-lg text-center text-sm">{message}</div>}

      <form onSubmit={handleSaveAll}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center gap-4 pt-6 pb-6">
              <Avatar className="w-32 h-32 border-4 border-muted">
                <AvatarImage src={profile.HeadshotURL || 'https://via.placeholder.com/150'} alt={profile.ActorName} />
                <AvatarFallback>{profile.ActorName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button type="button" variant="outline" asChild>
                  <span>{uploadingAvatar ? 'Uploading...' : 'Change Picture'}</span>
                </Button>
              </Label>
              <Input type="file" id="avatar-upload" className="hidden" accept="image/png, image/jpeg" onChange={handleAvatarUpload} disabled={uploadingAvatar}/>
            </div>

            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Basic Info</TabsTrigger>
                <TabsTrigger value="payout">Payout Settings</TabsTrigger>
              </TabsList>

              {/* === Basic Info Tab === */}
              <TabsContent value="info" className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ActorName">Display Name</Label>
                    <Input id="ActorName" name="ActorName" value={profile.ActorName || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Username / URL</Label>
                    <Input id="slug" name="slug" value={profile.slug || ''} onChange={handleInputChange} placeholder="e.g., your-name"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Gender">Gender</Label>
                    <Select name="Gender" value={profile.Gender} onValueChange={(value) => handleSelectChange('Gender', value)}>
                      <SelectTrigger><SelectValue placeholder="Select gender..." /></SelectTrigger>
                      <SelectContent>
                        {genderOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Language">Primary Language</Label>
                    <Select name="Language" value={profile.Language} onValueChange={(value) => handleSelectChange('Language', value)}>
                      <SelectTrigger><SelectValue placeholder="Select language..." /></SelectTrigger>
                      <SelectContent>
                        {languageOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {tagOptions.map(tag => {
                        const isSelected = (profile.Tags || '').includes(tag);
                        return (
                          <Button type="button" key={tag} variant={isSelected ? 'default' : 'secondary'} size="sm" onClick={() => handleTagToggle(tag)}>
                            {tag}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="bio">Your Bio</Label>
                    <Textarea id="bio" name="bio" rows={4} value={profile.bio || ''} onChange={handleInputChange} placeholder="Tell clients about your voice..."/>
                  </div>
                </div>
              </TabsContent>

              {/* === Payout Tab (MOVED) === */}
              <TabsContent value="payout" className="pt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bank Account Details</CardTitle>
                    <CardDescription>Enter where you wish to receive direct payments. This is required to enable the feature.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input id="bank_name" name="bank_name" value={profile.bank_name || ''} onChange={handleInputChange} placeholder="e.g., Attijariwafa Bank"/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank_holder_name">Account Holder Name</Label>
                      <Input id="bank_holder_name" name="bank_holder_name" value={profile.bank_holder_name || ''} onChange={handleInputChange} placeholder="Full name on account"/>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="bank_iban">IBAN</Label>
                      <Input id="bank_iban" name="bank_iban" value={profile.bank_iban || ''} onChange={handleInputChange} placeholder="MA..."/>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="bank_account_number">Account Number (RIB)</Label>
                      <Input id="bank_account_number" name="bank_account_number" value={profile.bank_account_number || ''} onChange={handleInputChange} placeholder="Full account number"/>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Direct Payment Eligibility</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {eligibilityLoading ? <p>Loading eligibility...</p> : (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1 bg-muted p-3 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground uppercase">Completed Orders</p>
                            <p className="text-xl font-bold">{completedOrderCount} / <span className="text-muted-foreground">1</span></p>
                          </div>
                          <div className="flex-1 bg-muted p-3 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground uppercase">Average Rating</p>
                            <p className="text-xl font-bold">{averageRating?.toFixed(1) ?? 'N/A'} / <span className="text-muted-foreground">3.0+</span></p>
                          </div>
                        </div>
                        <div className="p-4 bg-background rounded-lg text-center">
                          {(() => {
                            const isEligible = completedOrderCount >= 1 && (averageRating ?? 0) > 3.0;
                            if (profile.direct_payment_enabled) return <p className="text-green-500 font-semibold">✅ Direct Payments Approved & Enabled</p>;
                            if (profile.direct_payment_requested) return <p className="text-yellow-500 font-semibold">⏳ Request Pending Admin Approval</p>;
                            if (isEligible) return <Button type="button" onClick={handleRequestDirectPayment}>Request Admin Approval</Button>;
                            return <p className="text-muted-foreground">Meet the requirements to request direct payments.</p>;
                          })()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* --- Single Save Button --- */}
            <div className="mt-6 pt-6 border-t text-right">
              <Button type="submit" size="lg" disabled={isSaving}>
                <Save size={16} className="mr-2"/> {isSaving ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default DashboardProfile;