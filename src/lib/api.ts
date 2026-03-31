import { supabase } from '@/lib/supabase'

export interface ApiResponse<T = any> {
  data: T
  message?: string
  error?: string
}

// Helper wrapper to map Supabase response objects to the ApiResponse format
const wrap = async <T = any>(promise: PromiseLike<{data: any, error: any}>): Promise<ApiResponse<T>> => {
    const { data, error } = await promise;
    if (error) {
        throw new Error(error.message);
    }
    return { data: data as T };
}

export const api = {
  login: () => { throw new Error('Use AuthContext') },
  signup: () => { throw new Error('Use AuthContext') },
  logout: () => { throw new Error('Use AuthContext') },
  getCurrentUser: (): Promise<ApiResponse<any>> => wrap(supabase.from('profiles').select('*').single()),

  getPlans: async (): Promise<ApiResponse<any[]>> => ({ data: [{id: 'monthly', name:'Monthly Subscription', price: 15.00}, {id:'yearly', name:'Yearly Subscription', price: 150.00}] }),
  
  getSubscriptionStatus: async (): Promise<ApiResponse<any>> => {
    const res = await wrap(supabase.from('subscriptions').select('*').maybeSingle())
    if (!res.data && localStorage.getItem('mock_sub')) {
      return { data: { status: 'active', plan_type: localStorage.getItem('mock_sub'), current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } }
    }
    return res
  },

  startCheckout: async (planType: string): Promise<ApiResponse<{url: string}>> => {
    localStorage.setItem('mock_sub', planType)
    return { data: { url: '/dashboard' } }
  },
  cancelSubscription: (): Promise<ApiResponse<any>> => wrap(supabase.from('subscriptions').update({ status: 'canceled' }).eq('status', 'active')),

  addScore: async (score: number, scoreDate: string): Promise<ApiResponse<any>> => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error("Not logged in");
     return wrap(supabase.from('scores').insert([{ user_id: user.id, score, score_date: scoreDate }]).select());
  },
  getScores: (): Promise<ApiResponse<any[]>> => wrap(supabase.from('scores').select('*').order('score_date', { ascending: false })),
  updateScore: (id: string, score: number, scoreDate: string): Promise<ApiResponse<any>> => 
     wrap(supabase.from('scores').update({ score, score_date: scoreDate }).eq('id', id)),
  deleteScore: (id: string): Promise<ApiResponse<any>> => wrap(supabase.from('scores').delete().eq('id', id)),

  getCharities: (search?: string, filter?: string): Promise<ApiResponse<any[]>> => {
      let query = supabase.from('charities').select('*');
      if (search) query = query.ilike('name', `%${search}%`);
      return wrap(query);
  },
  getCharityDetail: (id: string): Promise<ApiResponse<any>> => wrap(supabase.from('charities').select('*').eq('id', id).single()),
  selectCharity: async (charityId: string, percentage: number): Promise<ApiResponse<any>> => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error("Not logged in");
     return wrap(supabase.from('profiles').update({ selected_charity_id: charityId, charity_percentage: percentage }).eq('id', user.id));
  },
  getUserCharitySelection: (): Promise<ApiResponse<any>> => wrap(supabase.from('profiles').select('selected_charity_id, charity_percentage, charities(*)').single()),

  getCurrentDraw: (): Promise<ApiResponse<any>> => wrap(supabase.from('draws').select('*').eq('status', 'pending').maybeSingle()),
  getDrawHistory: (): Promise<ApiResponse<any[]>> => wrap(supabase.from('draws').select('*').eq('status', 'completed').order('run_date', { ascending: false })),
  getDrawResults: (drawId: string): Promise<ApiResponse<any>> => wrap(supabase.from('winnings').select('*, profiles(full_name)').eq('draw_id', drawId)),

  getUserWinners: async (): Promise<ApiResponse<any[]>> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')
    return wrap(supabase.from('winnings').select('*, draws(run_date)').eq('user_id', user.id).order('created_at', { ascending: false }))
  },
  submitVerification: (winnerId: string, proofImageUrl: string): Promise<ApiResponse<any>> => 
     wrap(supabase.from('winnings').update({ proof_image_url: proofImageUrl, status: 'pending_verification' }).eq('id', winnerId)),

  getAdminUsers: (page?: number, limit?: number): Promise<ApiResponse<any>> => wrap(supabase.from('profiles').select('*')),
  getAdminWinners: (filter?: string): Promise<ApiResponse<any[]>> => wrap(supabase.from('winnings').select('*, profiles(full_name), draws(run_date)')),
  verifyWinner: (winnerId: string, verified: boolean, notes?: string): Promise<ApiResponse<any>> => 
     wrap(supabase.from('winnings').update({ status: verified ? 'approved' : 'rejected' }).eq('id', winnerId)),
  markWinnerPaid: (winnerId: string): Promise<ApiResponse<any>> => wrap(supabase.from('winnings').update({ status: 'paid' }).eq('id', winnerId)),
  
  simulateDraw: (): Promise<ApiResponse<any>> => { return Promise.resolve({ data: { success: true } }) },
  publishDraw: (): Promise<ApiResponse<any>> => wrap(supabase.rpc('execute_monthly_draw', { p_draw_type: 'random', p_alloc_per_sub: 2.00, p_previous_jackpot: 0 })),

  getAdminReports: (type: 'subscription' | 'charity' | 'draw'): Promise<ApiResponse<any>> => wrap(supabase.from('draws').select('*'))
}

export default api;
