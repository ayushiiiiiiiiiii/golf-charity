import React from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/context/AuthContext'
import { HeartIcon, TrophyIcon, ShieldCheckIcon } from 'lucide-react'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 text-center">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 max-w-4xl cursor-default">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <HeartIcon className="w-4 h-4" /> 
            <span>Over $1.2M raised for global causes</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Play with Purpose. <br className="hidden md:block"/> Change the World.
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            The platform that transforms your everyday achievements into extraordinary global impact. Subscribe, participate, and empower charities while earning your chance to be rewarded.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            {isAuthenticated ? (
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all rounded-full" onClick={() => navigate({ to: '/dashboard' })}>
                Access Your Dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all rounded-full" onClick={() => navigate({ to: '/checkout' })}>
                  Subscribe Now
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-slate-300 hover:bg-slate-100 transition-all" onClick={() => navigate({ to: '/charities' })}>
                  Explore Causes
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Impact & Mechanics Section */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12 text-center md:text-left">
            
            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0 group-hover:scale-110 transition-transform">
                <HeartIcon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-800">Support the Causes</h3>
              <p className="text-slate-600 leading-relaxed">
                Directly route a guaranteed percentage of your subscription to the charity of your choice. Real impact, every single month.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0 group-hover:scale-110 transition-transform">
                <ShieldCheckIcon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-800">Track & Verify</h3>
              <p className="text-slate-600 leading-relaxed">
                Record your performance authentically. Our rolling ledger curates your most recent achievements to keep the ecosystem fair and dynamic.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0 group-hover:scale-110 transition-transform">
                <TrophyIcon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-800">The Monthly Draw</h3>
              <p className="text-slate-600 leading-relaxed">
                Unlock your chance at the community prize pool. A fixed portion of all subscriptions fuels a massive monthly reward system.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      {!isAuthenticated && (
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-900">
             <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-800 to-transparent"></div>
          </div>
          <div className="container mx-auto px-6 relative z-10 max-w-3xl text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Become a catalyst for change.
            </h2>
            <p className="text-indigo-200 text-xl mb-12">
              Join thousands of individuals turning their personal passions into global action.
            </p>
            <Button size="lg" className="h-16 px-10 text-xl bg-white text-indigo-900 hover:bg-slate-100 rounded-full transition-all hover:scale-105" onClick={() => navigate({ to: '/checkout' })}>
              Start Your Journey
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

export default LandingPage
