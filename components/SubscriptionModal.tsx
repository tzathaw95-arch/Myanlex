import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Smartphone, Tag, CreditCard, Crown, X } from 'lucide-react';
import { getConfig } from '../services/db';
import { BillingConfig } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'expired' | 'info';
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, variant = 'expired' }) => {
  const [config, setConfig] = useState<BillingConfig | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isExpired = variant === 'expired';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900 bg-opacity-95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300 my-8 relative">
        
        {!isExpired && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-20"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          {isExpired ? (
            <>
              <ShieldAlert className="h-16 w-16 text-gold-500 mx-auto mb-4 relative z-10" />
              <h2 className="text-3xl font-serif font-bold text-white relative z-10">Premium Subscription</h2>
              <p className="text-gray-300 mt-2 relative z-10">Access Expired. Choose a plan to continue your legal research.</p>
            </>
          ) : (
            <>
              <Crown className="h-16 w-16 text-gold-500 mx-auto mb-4 relative z-10" />
              <h2 className="text-3xl font-serif font-bold text-white relative z-10">Membership Plans</h2>
              <p className="text-gray-300 mt-2 relative z-10">Simple, transparent pricing for legal professionals.</p>
            </>
          )}
        </div>

        <div className="p-8">
          
          {/* Pricing Tiers */}
          <div className="mb-10">
             <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-center gap-2">
                <Tag className="h-5 w-5 text-gold-600" />
                Select Your Plan
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <PricingCard title="1 Month" price="20,000 MMK" />
                <PricingCard title="3 Months" price="55,000 MMK" isPopular />
                <PricingCard title="6 Months" price="100,000 MMK" />
                <PricingCard title="1 Year" price="180,000 MMK" />
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             {/* Payment Methods */}
             <div>
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                   <CreditCard className="h-5 w-5 text-blue-600" />
                   Payment Methods
                </h4>
                <div className="space-y-4">
                    {/* KBZ Pay */}
                    <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 flex flex-col gap-1">
                      <div className="flex justify-between items-center mb-1">
                         <span className="font-bold text-blue-900">KBZ Pay</span>
                         <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">Mobile</span>
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-500">Name:</span>
                         <span className="font-semibold text-slate-900">{config?.kbz.name || "Loading..."}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-500">Phone:</span>
                         <span className="font-mono font-bold text-slate-900">{config?.kbz.phone || "Loading..."}</span>
                      </div>
                    </div>

                    {/* Wave Pay */}
                    <div className="border border-yellow-100 bg-yellow-50/50 rounded-xl p-4 flex flex-col gap-1">
                      <div className="flex justify-between items-center mb-1">
                         <span className="font-bold text-slate-900">Wave Pay</span>
                         <span className="bg-yellow-500 text-slate-900 text-[10px] px-1.5 py-0.5 rounded">Mobile</span>
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-500">Name:</span>
                         <span className="font-semibold text-slate-900">{config?.wave.name || "Loading..."}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-500">Phone:</span>
                         <span className="font-mono font-bold text-slate-900">{config?.wave.phone || "Loading..."}</span>
                      </div>
                    </div>
                </div>
             </div>

             {/* Instructions */}
             <div>
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-gold-600" />
                  Activation Steps:
                </h4>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 h-full">
                    <ol className="space-y-4 text-sm text-gray-700">
                      <li className="flex gap-3">
                        <span className="bg-slate-200 text-slate-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">1</span>
                        <span>Transfer the exact amount for your chosen plan.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-slate-200 text-slate-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">2</span>
                        <span>Take a <strong>screenshot</strong> of the transaction.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-slate-200 text-slate-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">3</span>
                        <span>Send screenshot via <strong>Viber</strong> to <span className="font-bold">{config?.kbz.phone || "Admin"}</span>.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-slate-200 text-slate-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">4</span>
                        <span>Admin will verify and activate your account instantly.</span>
                      </li>
                    </ol>
                </div>
             </div>
          </div>

          <div className="mt-8 text-center">
            {isExpired ? (
              <button 
                onClick={onClose}
                className="text-slate-500 hover:text-slate-800 text-sm font-medium hover:underline"
              >
                Logout and return to Home
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition"
              >
                Close Pricing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PricingCard = ({ title, price, isPopular }: { title: string, price: string, isPopular?: boolean }) => (
    <div className={`relative p-4 rounded-xl border-2 text-center transition hover:shadow-md cursor-default ${isPopular ? 'border-gold-400 bg-gold-50/30' : 'border-gray-100 bg-white'}`}>
        {isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">MOST POPULAR</div>}
        <div className="text-gray-500 text-sm font-medium mb-1">{title}</div>
        <div className="text-slate-900 font-bold text-lg">{price}</div>
    </div>
);
