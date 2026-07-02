/**
 * PharmaGenie Modular Payment & Billing Integration Module
 * 
 * This module manages the client-side billing lifecycle and supports pluggable payment providers.
 * You can easily configure and swap mock processing with actual production integrations for:
 * - Stripe
 * - Razorpay
 * - Google Pay
 * - Apple Pay
 */

export type PaymentProvider = 'stripe' | 'razorpay' | 'googlepay' | 'applepay';
export type BillingInterval = 'monthly' | 'yearly';
export type SubscriptionTier = 'pro' | 'enterprise';

// Extended licensing models for future expansion
export type LicensingType = 'individual' | 'family' | 'student' | 'hospital' | 'university';

export interface PaymentPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  interval: BillingInterval;
  amountMonthly: number;
  amountYearly: number;
  currency: string;
  savingsYearly: number;
  licensingType: LicensingType;
  maxSeats: number; // For enterprise/hospital multi-seat licenses
}

export interface CouponCampaign {
  code: string;
  discountPercent: number;
  description: string;
  validForTiers: SubscriptionTier[];
}

export interface UsageMetric {
  reportCountThisMonth: number;
  reportCountLimit: number;
  apiCallsThisMonth: number;
  apiCallsLimit: number;
  overageCostPerReport: number; // For usage-based billing
}

export interface PaymentOptions {
  provider: PaymentProvider;
  tier: SubscriptionTier;
  interval: BillingInterval;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  couponCode?: string;
  licensingType?: LicensingType;
  seatsRequested?: number;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  provider: PaymentProvider;
  tier: SubscriptionTier;
  interval: BillingInterval;
  amountPaid: number;
  appliedDiscountPercent?: number;
  error?: string;
}

// Active Sandbox Coupon Campaigns
export const SANDBOX_COUPONS: Record<string, CouponCampaign> = {
  'STUDENT50': {
    code: 'STUDENT50',
    discountPercent: 50,
    description: 'Academic student discount for future clinical geneticists',
    validForTiers: ['pro']
  },
  'HOSPITAL30': {
    code: 'HOSPITAL30',
    discountPercent: 30,
    description: 'Institutional onboarding program discount',
    validForTiers: ['enterprise']
  },
  'PGX2026': {
    code: 'PGX2026',
    discountPercent: 20,
    description: 'Annual PharmaGenie conference promo discount',
    validForTiers: ['pro', 'enterprise']
  }
};

// Pricing configuration
export const PRICING_PLANS: Record<SubscriptionTier, Omit<PaymentPlan, 'interval'>> = {
  pro: {
    id: 'plan_pro',
    tier: 'pro',
    name: 'PharmaGenie Pro',
    amountMonthly: 49,
    amountYearly: 39, // $39/mo billed annually
    currency: 'USD',
    savingsYearly: 120, // ($49 - $39) * 12 = $120 savings
    licensingType: 'individual',
    maxSeats: 1
  },
  enterprise: {
    id: 'plan_enterprise',
    tier: 'enterprise',
    name: 'PharmaGenie Enterprise',
    amountMonthly: 199,
    amountYearly: 159, // $159/mo billed annually
    currency: 'USD',
    savingsYearly: 480, // ($199 - $159) * 12 = $480 savings
    licensingType: 'hospital',
    maxSeats: 25 // Supports team seats natively
  }
};

/**
 * Service orchestrating modular payment processing.
 * To integrate live production gateways, replace the mock calls with official SDK clients.
 */
export class PaymentService {
  /**
   * Main entry point to initiate a payment checkout.
   */
  static async processPayment(
    options: PaymentOptions,
    onProgress?: (status: string) => void
  ): Promise<PaymentResult> {
    const { provider, tier, interval, amount, currency, couponCode } = options;
    console.log(`[PaymentService] Initiating ${interval} ${tier} payment of ${currency} ${amount} via ${provider}`);
    
    let finalAmount = amount;
    let appliedDiscount = 0;

    onProgress?.(`Contacting ${this.getProviderLabel(provider)} secure servers...`);
    await this.delay(600);

    // Apply Coupon Code if any
    if (couponCode) {
      const normalizedCode = couponCode.toUpperCase().trim();
      const campaign = SANDBOX_COUPONS[normalizedCode];
      if (campaign && campaign.validForTiers.includes(tier)) {
        appliedDiscount = campaign.discountPercent;
        finalAmount = Math.max(0, amount * (1 - appliedDiscount / 100));
        onProgress?.(`Applied promo coupon code "${normalizedCode}" - ${appliedDiscount}% Discount active.`);
        await this.delay(400);
      } else {
        onProgress?.(`Validating promo coupon... invalid code or inapplicable to plan.`);
        await this.delay(400);
      }
    }

    onProgress?.(`Verifying payment method authorization...`);
    await this.delay(700);

    onProgress?.(`Finalizing transaction...`);
    await this.delay(500);

    // Call individual modular integrations
    let result: PaymentResult;
    switch (provider) {
      case 'stripe':
        result = await this.processStripe(options, finalAmount);
        break;
      case 'razorpay':
        result = await this.processRazorpay(options, finalAmount);
        break;
      case 'googlepay':
        result = await this.processGooglePay(options, finalAmount);
        break;
      case 'applepay':
        result = await this.processApplePay(options, finalAmount);
        break;
      default:
        return {
          success: false,
          provider,
          tier,
          interval,
          amountPaid: amount,
          error: 'Unsupported payment provider requested.',
        };
    }

    if (appliedDiscount > 0) {
      result.appliedDiscountPercent = appliedDiscount;
    }
    return result;
  }

  /**
   * 1. Stripe Modular Integration
   * For production, install `@stripe/stripe-js` and use standard Checkout or PaymentElements.
   */
  private static async processStripe(options: PaymentOptions, finalAmount: number): Promise<PaymentResult> {
    console.log('[Stripe Integration] Calling Stripe Elements / payment intent API endpoint with amount:', finalAmount);
    return this.createSuccessfulMockResult(options, finalAmount);
  }

  /**
   * 2. Razorpay Modular Integration
   * For production, load standard Razorpay checkout script: `https://checkout.razorpay.com/v1/checkout.js`
   */
  private static async processRazorpay(options: PaymentOptions, finalAmount: number): Promise<PaymentResult> {
    console.log('[Razorpay Integration] Opening Razorpay checkout overlay with amount:', finalAmount);
    return this.createSuccessfulMockResult(options, finalAmount);
  }

  /**
   * 3. Google Pay Modular Integration
   * For production, load `https://pay.google.com/gp/p/js/pay.js`
   */
  private static async processGooglePay(options: PaymentOptions, finalAmount: number): Promise<PaymentResult> {
    console.log('[Google Pay Integration] Requesting Google Pay token sheet for amount:', finalAmount);
    return this.createSuccessfulMockResult(options, finalAmount);
  }

  /**
   * 4. Apple Pay Modular Integration
   * For production, use standard `ApplePaySession` browser API.
   */
  private static async processApplePay(options: PaymentOptions, finalAmount: number): Promise<PaymentResult> {
    console.log('[Apple Pay Integration] Checking Apple Pay eligibility & starting session with amount:', finalAmount);
    return this.createSuccessfulMockResult(options, finalAmount);
  }

  /**
   * Helper to format human-readable provider names
   */
  static getProviderLabel(provider: PaymentProvider): string {
    switch (provider) {
      case 'stripe': return 'Stripe Card Checkout';
      case 'razorpay': return 'Razorpay Secure';
      case 'googlepay': return 'Google Pay';
      case 'applepay': return 'Apple Pay';
      default: return provider;
    }
  }

  private static createSuccessfulMockResult(options: PaymentOptions, finalAmount: number): PaymentResult {
    const randomHex = Math.random().toString(16).substring(2, 12).toUpperCase();
    return {
      success: true,
      transactionId: `TXN-${options.provider.toUpperCase()}-${randomHex}`,
      provider: options.provider,
      tier: options.tier,
      interval: options.interval,
      amountPaid: finalAmount,
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
