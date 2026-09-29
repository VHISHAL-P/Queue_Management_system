# 🚀 Supabase Queries Reference Guide

This document contains all SQL scripts for setting up your Supabase database and JavaScript/TypeScript queries for interacting with Supabase from your Next.js application.

---

## 1. 📜 Database Setup SQL (Run in Supabase SQL Editor)

### Step 1: Create Tables & RLS Policies
```sql
-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    average_consultation_minutes INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    specialization TEXT,
    room_number TEXT DEFAULT 'Room 101',
    average_consultation_minutes INTEGER DEFAULT 10,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. QUEUES TABLE
CREATE TABLE IF NOT EXISTS public.queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_token_id UUID NULL,
    is_paused BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_doctor_queue_date UNIQUE(doctor_id, queue_date)
);

-- 7. TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number INTEGER NOT NULL,
    display_token TEXT NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    appointment_id UUID NULL REFERENCES public.appointments(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'PRIORITY', 'EMERGENCY')),
    status TEXT NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'ABSENT', 'CANCELLED')),
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'QUEUE_UPDATE',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

---

### Step 2: Create Stored Procedures (RPC Functions)
```sql
-- 1. Generate Queue Token Function
CREATE OR REPLACE FUNCTION public.generate_token(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_department_id UUID,
    p_priority TEXT DEFAULT 'NORMAL',
    p_appointment_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dept_code TEXT;
    v_queue_id UUID;
    v_next_token_num INT;
    v_display_token TEXT;
    v_token_id UUID;
BEGIN
    SELECT code INTO v_dept_code FROM public.departments WHERE id = p_department_id;
    IF v_dept_code IS NULL THEN
        RAISE EXCEPTION 'Invalid department ID';
    END IF;

    INSERT INTO public.queues (department_id, doctor_id, queue_date)
    VALUES (p_department_id, p_doctor_id, CURRENT_DATE)
    ON CONFLICT (doctor_id, queue_date) DO UPDATE SET doctor_id = EXCLUDED.doctor_id
    RETURNING id INTO v_queue_id;

    PERFORM 1 FROM public.queues WHERE id = v_queue_id FOR UPDATE;

    SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_next_token_num
    FROM public.tokens
    WHERE department_id = p_department_id
      AND doctor_id = p_doctor_id
      AND queue_date = CURRENT_DATE;

    v_display_token := v_dept_code || '-' || LPAD(v_next_token_num::text, 3, '0');

    INSERT INTO public.tokens (
        token_number, display_token, patient_id, doctor_id, department_id,
        appointment_id, priority, status, queue_date
    ) VALUES (
        v_next_token_num, v_display_token, p_patient_id, p_doctor_id, p_department_id,
        p_appointment_id, p_priority, 'WAITING', CURRENT_DATE
    )
    RETURNING id INTO v_token_id;

    RETURN jsonb_build_object(
        'success', true,
        'token_id', v_token_id,
        'display_token', v_display_token,
        'token_number', v_next_token_num
    );
END;
$$;

-- 2. Call Next Patient Function
CREATE OR REPLACE FUNCTION public.call_next_patient(
    p_doctor_id UUID,
    p_queue_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_token public.tokens%ROWTYPE;
BEGIN
    SELECT * INTO v_next_token
    FROM public.tokens
    WHERE doctor_id = p_doctor_id
      AND queue_date = CURRENT_DATE
      AND status = 'WAITING'
    ORDER BY
        CASE priority
            WHEN 'EMERGENCY' THEN 1
            WHEN 'PRIORITY' THEN 2
            WHEN 'NORMAL' THEN 3
            ELSE 4
        END,
        created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_next_token.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'No waiting patients in queue');
    END IF;

    UPDATE public.tokens
    SET status = 'CALLED', called_at = NOW()
    WHERE id = v_next_token.id;

    UPDATE public.queues
    SET current_token_id = v_next_token.id
    WHERE id = p_queue_id;

    RETURN jsonb_build_object(
        'success', true,
        'token_id', v_next_token.id,
        'display_token', v_next_token.display_token
    );
END;
$$;
```

---

### Step 3: Insert Initial Seed Data
```sql
INSERT INTO public.departments (name, code, description, average_consultation_minutes)
VALUES
    ('General Medicine', 'GM', 'Primary health care and checkups', 8),
    ('Cardiology', 'CAR', 'Cardiac evaluations and ECG', 15),
    ('Orthopedics', 'ORT', 'Bone and joint care', 12),
    ('Pediatrics', 'PED', 'Child health & immunization', 10),
    ('Dental', 'DEN', 'Oral health & procedures', 15)
ON CONFLICT (code) DO NOTHING;
```

---

## 2. ⚡ Client JavaScript/TypeScript Queries

### Select All Departments
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Fetch active departments
const { data: departments, error } = await supabase
  .from('departments')
  .select('*')
  .eq('is_active', true)
  .order('name');
```

### Select Today's Queue Tokens
```typescript
const today = new Date().toISOString().split('T')[0];

const { data: tokens, error } = await supabase
  .from('tokens')
  .select(`
    *,
    patient:patients(*, profile:profiles(*)),
    doctor:doctors(*, profile:profiles(*)),
    department:departments(*)
  `)
  .eq('queue_date', today)
  .order('created_at', { ascending: true });
```

### Execute RPC: Book New Token
```typescript
const { data, error } = await supabase.rpc('generate_token', {
  p_patient_id: 'PATIENT_UUID',
  p_doctor_id: 'DOCTOR_UUID',
  p_department_id: 'DEPARTMENT_UUID',
  p_priority: 'NORMAL'
});

console.log('Generated Token:', data.display_token);
```

### Execute RPC: Doctor Calls Next Patient
```typescript
const { data, error } = await supabase.rpc('call_next_patient', {
  p_doctor_id: 'DOCTOR_UUID',
  p_queue_id: 'QUEUE_UUID'
});

console.log('Called Token:', data.display_token);
```

### Subscribe to Live Real-Time Queue Updates
```typescript
const channel = supabase
  .channel('live-queue')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'tokens' },
    (payload) => {
      console.log('Realtime Queue Token Update:', payload);
    }
  )
  .subscribe();
```
