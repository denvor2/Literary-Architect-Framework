const fs = require('fs');
const path = require('path');

// Read the hook file
const hookPath = 'E:\Projects\Literary-Architect-Framework\apps\studio\src\billing\useBillingController.ts';
const hookContent = fs.readFileSync(hookPath, 'utf-8');

// Verify key components
const checks = {
  hasUseClient: hookContent.includes('"use client"'),
  hasUseEffect: hookContent.includes('useEffect'),
  hasUseState: hookContent.includes('useState'),
  hasBillingState: hookContent.includes('type BillingState'),
  hasBillingActions: hookContent.includes('type BillingActions'),
  hasUseBillingController: hookContent.includes('export function useBillingController'),
  hasLoadCurrentPlan: hookContent.includes('const loadCurrentPlan'),
  hasSelectPlan: hookContent.includes('const selectPlan'),
  hasCancelSubscription: hookContent.includes('const cancelSubscription'),
  hasApiCall1: hookContent.includes('/api/billing/plan'),
  hasApiCall2: hookContent.includes('/api/billing/subscribe'),
  hasErrorHandling: hookContent.includes('try') && hookContent.includes('catch'),
  hasDaysUntilExpiry: hookContent.includes('daysUntilExpiry'),
  hasIsExpired: hookContent.includes('isExpired'),
  selectPlanReturnsObject: hookContent.includes('return {') && hookContent.includes('subscription:') && hookContent.includes('stripePaymentIntent:'),
  hasInitialState: hookContent.includes('useState<BillingState>({'),
  hasUseEffectOnMount: hookContent.includes('useEffect(() => {') && hookContent.includes('void loadCurrentPlan();'),
};

console.log('Hook Verification Results:');
console.log('=========================');
Object.entries(checks).forEach(([key, value]) => {
  console.log(`${key}: ${value ? 'PASS' : 'FAIL'}`);
});

const allPassed = Object.values(checks).every(v => v === true);
console.log(`\nOverall: ${allPassed ? 'PASS' : 'FAIL'}`);

// Verify initial state
console.log('\nInitial state validation:');
const initialState = {
  currentPlan: null,
  currentSubscription: null,
  daysUntilExpiry: null,
  isExpired: false,
  isLoading: false,
  error: null,
};

Object.entries(initialState).forEach(([key, value]) => {
  const pattern = new RegExp(`${key}:\s*${value === null ? 'null' : value}`);
  const found = pattern.test(hookContent);
  console.log(`  ${key}: ${found ? 'PASS' : 'FAIL'}`);
});

process.exit(allPassed ? 0 : 1);
