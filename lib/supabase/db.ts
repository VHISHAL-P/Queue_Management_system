import { createClient } from './client';
import { Department, Doctor, Patient, Token, Queue, TokenPriority, TokenStatus } from '@/types/queue';

/**
 * Health check: Verify if Supabase is connected and credentials are set
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
    try {
        const supabase = createClient();
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!url || url.includes('placeholder-project')) {
            return { connected: false, message: 'Supabase URL is set to placeholder value.' };
        }

        const { count, error } = await supabase.from('departments').select('*', { count: 'exact', head: true });

        if (error) {
            return { connected: false, message: `Supabase connection error: ${error.message}` };
        }

        return { connected: true, message: `Connected to Supabase. Found ${count ?? 0} department records.` };
    } catch (err: any) {
        return { connected: false, message: err?.message || 'Failed to connect to Supabase.' };
    }
}

/**
 * 1. Fetch all active departments
 */
export async function fetchDepartmentsFromSupabase(): Promise<Department[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data as Department[];
}

/**
 * 2. Fetch doctors with profiles and departments
 */
export async function fetchDoctorsFromSupabase(): Promise<Doctor[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('doctors')
        .select(`
      *,
      profile:profiles(*),
      department:departments(*)
    `)
        .eq('is_available', true);

    if (error) throw error;
    return data as Doctor[];
}

/**
 * 3. Fetch patients with profile details
 */
export async function fetchPatientsFromSupabase(): Promise<Patient[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('patients')
        .select(`
      *,
      profile:profiles(*)
    `);

    if (error) throw error;
    return data as Patient[];
}

/**
 * 4. Fetch queue tokens (filtered by doctorId or all for today)
 */
export async function fetchTokensFromSupabase(doctorId?: string): Promise<Token[]> {
    const supabase = createClient();
    const todayStr = new Date().toISOString().split('T')[0];

    let query = supabase
        .from('tokens')
        .select(`
      *,
      patient:patients(*, profile:profiles(*)),
      doctor:doctors(*, profile:profiles(*)),
      department:departments(*)
    `)
        .eq('queue_date', todayStr)
        .order('created_at', { ascending: true });

    if (doctorId) {
        query = query.eq('doctor_id', doctorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Token[];
}

/**
 * 5. RPC: Generate Token for Patient
 */
export async function generateTokenSupabase(params: {
    patientId: string;
    doctorId: string;
    departmentId: string;
    priority?: TokenPriority;
    appointmentId?: string;
}) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('generate_token', {
        p_patient_id: params.patientId,
        p_doctor_id: params.doctorId,
        p_department_id: params.departmentId,
        p_priority: params.priority || 'NORMAL',
        p_appointment_id: params.appointmentId || null,
    });

    if (error) throw error;
    return data;
}

/**
 * 6. RPC: Call Next Patient in Queue
 */
export async function callNextPatientSupabase(doctorId: string, queueId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('call_next_patient', {
        p_doctor_id: doctorId,
        p_queue_id: queueId,
    });

    if (error) throw error;
    return data;
}

/**
 * 7. RPC: Start Consultation
 */
export async function startConsultationSupabase(tokenId: string, doctorId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('start_consultation', {
        p_token_id: tokenId,
        p_doctor_id: doctorId,
    });

    if (error) throw error;
    return data;
}

/**
 * 8. RPC: Complete Consultation
 */
export async function completeConsultationSupabase(tokenId: string, doctorId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('complete_current_patient', {
        p_token_id: tokenId,
        p_doctor_id: doctorId,
    });

    if (error) throw error;
    return data;
}

/**
 * 9. Realtime Subscription to Token & Queue changes
 */
export function subscribeToQueueRealtime(onChange: (payload: any) => void) {
    const supabase = createClient();
    const channel = supabase
        .channel('queue_realtime_changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tokens' },
            (payload) => onChange(payload)
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'queues' },
            (payload) => onChange(payload)
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
