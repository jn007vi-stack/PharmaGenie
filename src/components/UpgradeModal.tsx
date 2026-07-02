import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Check, 
  Sparkles, 
  Lock, 
  Layers, 
  Scale, 
  Users,
  Dna,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  HelpCircle,
  Coins,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Activity,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PRICING_PLANS, 
  PaymentService, 
  PaymentProvider, 
  BillingInterval, 
  SubscriptionTier 
} from '../lib/payments';
import { useToast } from './Toast';

export default function UpgradeModal() {
  const { 
    isUpgradeModalOpen, 
    setUpgradeModalOpen, 
    subscriptionTier, 
    upgradeToPro, 
    upgradeToEnterprise,
    downgradeToFree,
    startProTrial,
    simulatePaymentSuccess,
    simulatePaymentFailure,
    simulatePlanRenewal,
    simulatePlanExpiration,
    simulateTrialEndingSoon,
    simulateMonthlyLimitReached,
    trialUsed,
    trialExpiresAt,
    subscriptionExpiresAt
  } = useAuth();

  const { success, warning, info } = useToast();

  // Component states
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('stripe');
  
  // Checkout/Payment animation states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState('');

  if (!isUpgradeModalOpen) return null;

  // Benefits for Pro
  const proBenefits = [
    { title: 'Unlimited Assessments', desc: 'No more monthly report caps. Run unlimited patient screenings.', icon: Layers },
    { title: 'Full AI Interpretation Pipeline', desc: 'Unlock Gemini-powered clinical analysis and alternative recommendations.', icon: Sparkles },
    { title: 'Advanced Side-by-Side Comparison', desc: 'Compare multi-variant clinical histories with live variance highlights.', icon: Scale },
    { title: 'Collaboration Workbenches', desc: 'Share, audit, and annotate patient reports with other care teams.', icon: Users }
  ];

  // Benefits for Enterprise
  const enterpriseBenefits = [
    { title: 'Dedicated HIPAA Cloud Vault', desc: 'Fully compliant secure sandbox with independent database instances.', icon: ShieldCheck },
    { title: 'Pluggable Custom API Keys', desc: 'Inject your own institutional or clinical research keys directly.', icon: Dna },
    { title: 'On-Premise Deployment Hooks', desc: 'Docker/Kubernetes integration configs for internal health systems.', icon: Activity },
    { title: '24/7 Care Support Service', desc: 'Under 1-hour SLA responses from PGx specialist developer crews.', icon: HelpCircle }
  ];

  const handleSelectPlan = (tier: SubscriptionTier) => {
    setSelectedPlan(tier);
  };

  const handleBackToPlans = () => {
    setSelectedPlan(null);
    setShowSuccessScreen(false);
  };

  const handleStartPayment = async () => {
    if (!selectedPlan) return;

    const planInfo = PRICING_PLANS[selectedPlan];
    const unitPrice = billingInterval === 'yearly' ? planInfo.amountYearly : planInfo.amountMonthly;
    const finalAmount = unitPrice * (billingInterval === 'yearly' ? 12 : 1);

    setIsProcessing(true);
    setProcessingStatus('Initializing payment checkout framework...');

    try {
      const result = await PaymentService.processPayment({
        provider: paymentProvider,
        tier: selectedPlan,
        interval: billingInterval,
        amount: finalAmount,
        currency: planInfo.currency,
        customerEmail: 'clinician@pharmagenie.local'
      }, (status) => {
        setProcessingStatus(status);
      });

      if (result.success) {
        setLastTransactionId(result.transactionId || 'TXN-GENERIC-MOCK');
        
        // Update user auth profile in state/database
        if (selectedPlan === 'enterprise') {
          await upgradeToEnterprise();
        } else {
          await upgradeToPro();
        }

        setShowSuccessScreen(true);
      } else {
        warning(result.error || 'Payment transaction declined.');
      }
    } catch (err: any) {
      warning('Billing integration connection interrupted. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDowngradeAction = async () => {
    try {
      await downgradeToFree();
      success('Subscription has been demoted to Free tier for testing.');
      setUpgradeModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/90 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
          id="upgrade-modal-portal"
        >
          
          {/* Top Banner and Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-100/40 dark:border-teal-900/40 shadow-3xs">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-base sm:text-lg font-display tracking-tight flex items-center gap-2">
                  <span>Pharmacogenomics Licensing Center</span>
                  <span className="text-[9px] bg-teal-500/10 text-teal-600 dark:text-teal-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-teal-500/20">
                    SaaS Billing Hub
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure clinic licensing, explore enterprise options, and process secure payments.</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (!isProcessing) setUpgradeModalOpen(false);
              }}
              disabled={isProcessing}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer border border-transparent disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main content viewport */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            
            <AnimatePresence mode="wait">
              {showSuccessScreen ? (
                /* Success Screen */
                <motion.div
                  key="success-screen"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4 shadow-3xs">
                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white font-display uppercase tracking-tight">Payment Completed Successfully!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 max-w-md">
                    Your clinical workspace licensing has been updated instantly. All premium variant features and workspace capabilities are now active.
                  </p>

                  <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl w-full max-w-md text-left space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">Transaction Reference</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-black">{lastTransactionId}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">Plan Provisioned</span>
                      <span className="text-teal-600 dark:text-teal-400 font-black uppercase text-[11px] tracking-wider">
                        {selectedPlan === 'enterprise' ? 'PharmaGenie Enterprise' : 'PharmaGenie Pro'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">Billing Interval</span>
                      <span className="text-slate-700 dark:text-slate-300 font-bold capitalize">{billingInterval} billing</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-8">
                    <button
                      onClick={() => setUpgradeModalOpen(false)}
                      className="px-6 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-black rounded-xl cursor-pointer hover:opacity-90 shadow-xs"
                    >
                      Enter Clinical Dashboard
                    </button>
                    <button
                      onClick={handleBackToPlans}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      View Other Plans
                    </button>
                  </div>
                </motion.div>
              ) : selectedPlan ? (
                /* Payment Checkout Screen */
                <motion.div
                  key="checkout-screen"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-8"
                >
                  {/* Left Column: Order details */}
                  <div className="md:col-span-5 flex flex-col gap-6">
                    <button
                      onClick={handleBackToPlans}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-all disabled:opacity-50"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to plans</span>
                    </button>

                    <div className="p-5 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                      <span className="text-[9px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-2">Order Review</span>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white font-display">
                        {PRICING_PLANS[selectedPlan].name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">
                        {selectedPlan === 'enterprise' 
                          ? 'Institutional-grade system with HIPAA cloud configuration.' 
                          : 'Professional clinical practice suite with full AI capabilities.'}
                      </p>

                      <div className="h-px bg-slate-200 dark:bg-slate-800 my-4"></div>

                      <div className="space-y-2.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500">Subscription cycle</span>
                          <span className="text-slate-800 dark:text-slate-200 capitalize">{billingInterval}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500">Unit rate</span>
                          <span className="text-slate-800 dark:text-slate-200">
                            ${billingInterval === 'yearly' ? PRICING_PLANS[selectedPlan].amountYearly : PRICING_PLANS[selectedPlan].amountMonthly} / month
                          </span>
                        </div>

                        {billingInterval === 'yearly' && (
                          <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <span>Yearly savings</span>
                            <span>Save ${PRICING_PLANS[selectedPlan].savingsYearly} / year</span>
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-slate-200 dark:bg-slate-800 my-4"></div>

                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Total Due</span>
                        <div className="text-right">
                          <span className="text-2xl font-black text-slate-950 dark:text-white font-display">
                            ${billingInterval === 'yearly' 
                              ? PRICING_PLANS[selectedPlan].amountYearly * 12 
                              : PRICING_PLANS[selectedPlan].amountMonthly}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">
                            {PRICING_PLANS[selectedPlan].currency} {billingInterval === 'yearly' ? '/ yr' : '/ mo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-50/10 dark:bg-indigo-950/10 border border-indigo-200/20 rounded-xl text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold leading-relaxed">
                      💡 <strong>Sandbox Notice:</strong> No live billing transaction or credit card is processed. Clicking pay will instantly authorize mock subscription credentials for testing.
                    </div>
                  </div>

                  {/* Right Column: Gateway selectors */}
                  <div className="md:col-span-7 flex flex-col gap-6">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">Select Payment Gateway</span>
                      <h4 className="text-base font-black text-slate-900 dark:text-white font-display">Pluggable Providers</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-405 leading-snug">The billing infrastructure supports quick hooks to swap with standard developer SDKs.</p>
                    </div>

                    {/* Payment Gateways Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'stripe', label: 'Stripe Checkout', desc: 'Secure card systems', icon: CreditCard },
                        { id: 'razorpay', label: 'Razorpay Secure', desc: 'Standard API overlay', icon: Coins },
                        { id: 'googlepay', label: 'Google Pay', desc: 'One-click wallet token', icon: Wallet },
                        { id: 'applepay', label: 'Apple Pay', desc: 'Express Apple sheet', icon: Wallet }
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = paymentProvider === item.id;
                        return (
                          <button
                            key={item.id}
                            disabled={isProcessing}
                            onClick={() => setPaymentProvider(item.id as PaymentProvider)}
                            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-3 h-28 relative ${
                              isSelected
                                ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-500/10 text-teal-900 dark:text-teal-200'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className={`p-2 rounded-xl shrink-0 ${
                                isSelected ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-950 text-slate-400'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-teal-500 text-white flex items-center justify-center p-0.5 shadow-3xs">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              )}
                            </div>

                            <div>
                              <span className="text-xs font-black block leading-tight">{item.label}</span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5 leading-none">{item.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Progress Bar Loader */}
                    {isProcessing ? (
                      <div className="p-5 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                          <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{processingStatus}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.8, ease: 'easeInOut' }}
                            className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full"
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleStartPayment}
                        className="w-full py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black text-sm rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-teal-400 dark:text-teal-600 animate-pulse" />
                        <span>Process Mock Payment (${billingInterval === 'yearly' ? PRICING_PLANS[selectedPlan].amountYearly * 12 : PRICING_PLANS[selectedPlan].amountMonthly}.00)</span>
                      </button>
                    )}

                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        🔒 Enterprise-grade TLS 1.3 encryption & PCI-DSS Compliant pipeline sandbox hooks.
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Plan Selection Grid */
                <motion.div
                  key="plans-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-8"
                >
                  
                  {/* Dynamic Illustrations Display Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 rounded-3xl p-5 sm:p-6 text-white overflow-hidden relative border border-slate-800 shadow-xl select-none" id="illustration-showcase-panel">
                    
                    {/* SVG Illustration Left side */}
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="p-3.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-2xl hidden sm:block shrink-0">
                        <Dna className="w-10 h-10 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest bg-teal-950/40 border border-teal-900/30 px-2 py-0.5 rounded-full">
                          AI Diagnostic Engines Unlocked
                        </span>
                        <h4 className="text-xl font-black font-display tracking-tight mt-1">Unlock Multi-Variant Diagnostics</h4>
                        <p className="text-xs text-slate-350 mt-1 max-w-sm">
                          Gain unlimited processing of genomic assays, cross-variant comparisons, and interactive Gemini clinical intelligence.
                        </p>
                      </div>
                    </div>

                    {/* SVG Illustration Right side */}
                    <div className="flex items-center gap-4 relative z-10 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                      <div className="p-3.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl hidden sm:block shrink-0">
                        <ShieldCheck className="w-10 h-10 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 rounded-full">
                          Institutional SLA Compliance
                        </span>
                        <h4 className="text-xl font-black font-display tracking-tight mt-1">Institutional Care Systems</h4>
                        <p className="text-xs text-slate-350 mt-1 max-w-sm">
                          Enterprise tiers support custom API keys, HIPAA sandboxes, and prioritized 24/7 technical specialist SLAs.
                        </p>
                      </div>
                    </div>

                    {/* Visual abstract bg accents */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-3xl rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full"></div>
                  </div>

                  {/* Billing interval slider */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white font-display">Subscription License Tiers</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-405 leading-tight">Pick a subscription scale that fits your current clinical practice or research department.</p>
                    </div>

                    {/* Sliding toggle */}
                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-150 dark:border-slate-850 shrink-0 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => setBillingInterval('monthly')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          billingInterval === 'monthly'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-3xs border border-slate-200/50 dark:border-slate-800/50 font-black'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        }`}
                      >
                        Monthly Billing
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingInterval('yearly')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          billingInterval === 'yearly'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-3xs border border-slate-200/50 dark:border-slate-800/50 font-black'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        }`}
                      >
                        <span>Annual Billing</span>
                        <span className="text-[9px] bg-teal-500 text-white font-extrabold px-1.5 py-0.5 rounded-md leading-none">
                          Save 20%
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Dual Plan Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* PharmaGenie Pro Card */}
                    <div className={`border rounded-3xl p-6 sm:p-7 relative flex flex-col justify-between transition-all h-full ${
                      subscriptionTier === 'pro'
                        ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-500/10 shadow-md ring-1 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-750 bg-white dark:bg-slate-900 shadow-3xs'
                    }`}>
                      {subscriptionTier === 'pro' && (
                        <span className="absolute -top-3 left-6 text-[10px] font-black bg-teal-500 text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                          Active Professional Plan
                        </span>
                      )}

                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center gap-1 bg-teal-500/10 px-2.5 py-0.5 rounded-md">
                            <Sparkles className="w-3 h-3 animate-spin" /> PRO ACCESS
                          </span>
                        </div>

                        <h4 className="text-2xl font-black text-slate-900 dark:text-white font-display mt-3">PharmaGenie Pro</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">Excellent for independent specialists, genomic researchers, and boutique clinical practices.</p>

                        <div className="mt-5 flex items-baseline gap-1.5">
                          <span className="text-4xl font-black text-slate-900 dark:text-white font-display">
                            ${billingInterval === 'yearly' ? PRICING_PLANS.pro.amountYearly : PRICING_PLANS.pro.amountMonthly}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">USD / Month</span>
                        </div>

                        {billingInterval === 'yearly' && (
                          <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            Billed annually (${PRICING_PLANS.pro.amountYearly * 12}/yr) • Save ${PRICING_PLANS.pro.savingsYearly} yearly
                          </div>
                        )}

                        <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-5"></div>

                        {/* Benefits of Pro List */}
                        <div className="space-y-3.5 text-xs">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Benefits of Pro Suite:</span>
                          {proBenefits.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.title} className="flex items-start gap-3">
                                <div className="p-1.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg shrink-0 mt-0.5 border border-teal-500/10">
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 block leading-snug">{item.title}</span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-405 block mt-0.5 leading-normal font-semibold">{item.desc}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-850">
                        {subscriptionTier === 'pro' ? (
                          <div className="flex flex-col gap-2">
                            <div className="text-center text-[11px] text-teal-600 dark:text-teal-450 font-black p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                              Active in current medical session.
                            </div>
                            <button
                              onClick={handleDowngradeAction}
                              className="w-full py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-[11px] text-slate-500 font-bold rounded-xl cursor-pointer transition-all"
                            >
                              Demote to Free
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSelectPlan('pro')}
                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>License Pro Suite</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* PharmaGenie Enterprise Card */}
                    <div className={`border rounded-3xl p-6 sm:p-7 relative flex flex-col justify-between transition-all h-full ${
                      subscriptionTier === 'enterprise'
                        ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-md ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-750 bg-white dark:bg-slate-900 shadow-3xs'
                    }`}>
                      {subscriptionTier === 'enterprise' && (
                        <span className="absolute -top-3 left-6 text-[10px] font-black bg-indigo-500 text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                          Active Enterprise Plan
                        </span>
                      )}

                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-0.5 rounded-md">
                            <ShieldCheck className="w-3 h-3 text-indigo-500" /> INSTITUTIONAL SLA
                          </span>
                        </div>

                        <h4 className="text-2xl font-black text-slate-900 dark:text-white font-display mt-3">PharmaGenie Enterprise</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">Tailored for research hospitals, clinical laboratories, universities, and pharmaceutical groups.</p>

                        <div className="mt-5 flex items-baseline gap-1.5">
                          <span className="text-4xl font-black text-slate-900 dark:text-white font-display">
                            ${billingInterval === 'yearly' ? PRICING_PLANS.enterprise.amountYearly : PRICING_PLANS.enterprise.amountMonthly}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">USD / Month</span>
                        </div>

                        {billingInterval === 'yearly' && (
                          <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            Billed annually (${PRICING_PLANS.enterprise.amountYearly * 12}/yr) • Save ${PRICING_PLANS.enterprise.savingsYearly} yearly
                          </div>
                        )}

                        <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-5"></div>

                        {/* Benefits of Enterprise List */}
                        <div className="space-y-3.5 text-xs">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Benefits of Enterprise Suite:</span>
                          {enterpriseBenefits.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.title} className="flex items-start gap-3">
                                <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0 mt-0.5 border border-indigo-500/10">
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 block leading-snug">{item.title}</span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-405 block mt-0.5 leading-normal font-semibold">{item.desc}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-850">
                        {subscriptionTier === 'enterprise' ? (
                          <div className="flex flex-col gap-2">
                            <div className="text-center text-[11px] text-indigo-600 dark:text-indigo-450 font-black p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                              Institutional license verified and active.
                            </div>
                            <button
                              onClick={handleDowngradeAction}
                              className="w-full py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-[11px] text-slate-500 font-bold rounded-xl cursor-pointer transition-all"
                            >
                              Demote to Free
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSelectPlan('enterprise')}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>License Enterprise Suite</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Premium Trial & Simulation Dashboard */}
                  <div className="mt-8 space-y-6" id="billing-simulation-suite">
                    
                    {/* Trial System Action Banner */}
                    <div className="bg-gradient-to-r from-teal-500/10 to-indigo-500/10 dark:from-teal-500/5 dark:to-indigo-500/5 rounded-2xl border border-teal-200/50 dark:border-teal-900/40 p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-500/20">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                            <span>14-Day Pro Trial Program</span>
                            <span className="text-[9px] bg-teal-500 text-white font-black px-1.5 py-0.5 rounded-md uppercase">
                              Free Trial
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-normal">
                            Activate full-featured Pro workspace access for 14 days. Limit one trial per account.
                          </p>
                          {trialExpiresAt && (
                            <span className="inline-block mt-1.5 text-[10px] font-bold text-teal-600 dark:text-teal-455 bg-teal-500/10 px-2 py-0.5 rounded-md">
                              Trial Active Until: {new Date(trialExpiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {trialUsed ? (
                        <div className="text-center sm:text-right shrink-0">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block">Trial Used</span>
                          <span className="text-[10px] text-slate-405 dark:text-slate-500 block mt-0.5">Enforced: One trial per account.</span>
                        </div>
                      ) : (
                        <button
                          onClick={startProTrial}
                          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl cursor-pointer transition-all shrink-0 shadow-3xs flex items-center gap-1.5 hover:scale-[1.01]"
                        >
                          <span>Start 14-Day Free Trial</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Notification & Billing Event Simulator */}
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3.5">
                        <Coins className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                          SaaS & Billing Event Simulator
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-semibold leading-relaxed text-left">
                        Verify billing state transformations, automated downgrades, and professional toast notifications. Use the controls below to trigger mock gateway events:
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <button
                          onClick={simulatePaymentSuccess}
                          className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-left rounded-xl transition-all cursor-pointer shadow-3xs hover:shadow-2xs"
                        >
                          <span className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                            Payment Success
                          </span>
                          <span className="block text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                            Simulate card verification and invoicing.
                          </span>
                        </button>

                        <button
                          onClick={simulatePaymentFailure}
                          className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-left rounded-xl transition-all cursor-pointer shadow-3xs hover:shadow-2xs"
                        >
                          <span className="block text-[10px] font-black text-rose-600 dark:text-rose-450 uppercase tracking-wider mb-1">
                            Payment Failed
                          </span>
                          <span className="block text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                            Trigger bank declined alert warning.
                          </span>
                        </button>

                        <button
                          onClick={simulatePlanRenewal}
                          className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-left rounded-xl transition-all cursor-pointer shadow-3xs hover:shadow-2xs"
                        >
                          <span className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                            Plan Renewed
                          </span>
                          <span className="block text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                            Simulate standard billing cycle extension.
                          </span>
                        </button>

                        <button
                          onClick={simulatePlanExpiration}
                          className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-left rounded-xl transition-all cursor-pointer shadow-3xs hover:shadow-2xs"
                        >
                          <span className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                            Plan Expired
                          </span>
                          <span className="block text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                            Enforce automatic revert and lock features.
                          </span>
                        </button>

                        <button
                          onClick={simulateTrialEndingSoon}
                          className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-left rounded-xl transition-all cursor-pointer shadow-3xs hover:shadow-2xs"
                        >
                          <span className="block text-[10px] font-black text-amber-600 dark:text-amber-450 uppercase tracking-wider mb-1">
                            Trial Ending Soon
                          </span>
                          <span className="block text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                            Generate standard 48h expiration warning.
                          </span>
                        </button>

                        <button
                          onClick={simulateMonthlyLimitReached}
                          className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-left rounded-xl transition-all cursor-pointer shadow-3xs hover:shadow-2xs"
                        >
                          <span className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Limit Reached
                          </span>
                          <span className="block text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                            Trigger monthly report count limit warning.
                          </span>
                        </button>
                      </div>
                    </div>

                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-slate-400 dark:text-slate-550 font-bold shrink-0">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span>Institutional GDPR & HIPAA Medical Confidentiality Standards Ensured</span>
            </span>
            <span>All mock gateways comply with sandbox guidelines. No charge occurs.</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
