import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

const AuthContext = createContext(null);

function mapProfileToUser(profile, sessionUser) {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email || profile?.email || "",
    name: profile?.full_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
    username: profile?.username || sessionUser.user_metadata?.username || sessionUser.email?.split("@")[0] || "user",
    role: profile?.role || "reviewer",
    firmName: profile?.firm_name || "",
    phone: profile?.phone || "",
    avatarUrl: profile?.avatar_url || null,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) console.warn("Profile load:", error.message);
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) loadProfile(s.user.id).finally(() => mounted && setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) {
        await loadProfile(s.user.id);
        if (typeof window !== "undefined") window.__KNSL_USER_ID__ = s.user.id;
      } else {
        setProfile(null);
        if (typeof window !== "undefined") window.__KNSL_USER_ID__ = "";
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const user = useMemo(() => mapProfileToUser(profile, session?.user), [profile, session]);

  useEffect(() => {
    if (user?.id && typeof window !== "undefined") window.__KNSL_USER_ID__ = user.id;
  }, [user?.id]);

  const signUp = async ({ email, password, fullName, username }) => {
    if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim(), username: (username || email.split("@")[0]).trim().toLowerCase() },
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });
    if (error) throw error;
    if (data.user && !data.session) {
      return { needsEmailConfirmation: true, user: data.user };
    }
    return { needsEmailConfirmation: false, user: data.user, session: data.session };
  };

  const signIn = async (email, password) => {
    if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email) => {
    if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const updateProfile = async (fields) => {
    if (!supabase || !session?.user) throw new Error("Belum login.");
    const row = {
      full_name: fields.fullName ?? fields.name,
      username: fields.username?.toLowerCase(),
      firm_name: fields.firmName,
      phone: fields.phone,
      avatar_url: fields.avatarUrl,
    };
    Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);

    const { data, error } = await supabase
      .from("profiles")
      .update(row)
      .eq("id", session.user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  const refreshProfile = () => session?.user && loadProfile(session.user.id);

  const value = {
    isSupabase: isSupabaseConfigured,
    loading,
    session,
    profile,
    user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus di dalam AuthProvider");
  return ctx;
}
