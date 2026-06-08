-- Support Google OAuth & phone OTP signups in profiles trigger

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_username TEXT;
  v_phone TEXT;
BEGIN
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    NULLIF(TRIM(NEW.phone), ''),
    'Pengguna'
  );

  v_username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'user_' || LEFT(REPLACE(NEW.id::text, '-', ''), 8)
  );

  v_phone := COALESCE(
    NULLIF(TRIM(NEW.phone), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '')
  );

  INSERT INTO public.profiles (id, email, full_name, username, phone, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_username,
    v_phone,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'), '')
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = CASE WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  RETURN NEW;
END;
$$;
