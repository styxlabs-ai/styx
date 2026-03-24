// ============================================================
// STYX x402 Client SDK
// For AI agents to consume Styx compliance services
// ============================================================

import { privateKeyToAccount } from 'viem/accounts';
import { x402Client, x402HTTPClient } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

// ============================================================
// TYPES
// ============================================================

export interface WalletConfig {
  address: `0x${string}`;
  privateKey: `0x${string}`;
  network: 'eip155:8453' | 'eip155:84532';
}

export interface ClientConfig {
  apiUrl: string;
  wallet: WalletConfig;
  verbose?: boolean;
}

export interface PaymentReceipt {
  receiptId: string;
  endpoint: string;
  amount: number;
  currency: 'USDC';
  network: string;
  txHash: string;
  paidAt: number;
  paidBy: string;
  paidTo: string;
}

// ============================================================
// RESPONSE TYPES
// ============================================================

export interface SanctionsResponse {
  dealId: string;
  timestamp: string;
  overallCleared: boolean;
  results: Array<{
    address: string;
    role: string;
    sanctioned: boolean;
    source: string;
  }>;
}

export interface ComplianceResponse {
  dealId: string;
  jurisdiction: string;
  timestamp: string;
  overallStatus: 'approved' | 'rejected' | 'pending_review';
  checks: Array<{
    ruleId: string;
    ruleName: string;
    jurisdiction: string;
    required: boolean;
    passed: boolean;
    details: string;
  }>;
  sanctionsScreening: {
    buyerCleared: boolean;
    sellerCleared: boolean;
    entityCleared: boolean;
    screenedAt: number;
    source: string;
  };
}

// ============================================================
// PAYMENT LEDGER
// ============================================================

export class PaymentLedger {
  private receipts: PaymentReceipt[] = [];

  record(receipt: PaymentReceipt): void {
    this.receipts.push(receipt);
  }

  getReceipts(): PaymentReceipt[] {
    return [...this.receipts];
  }

  getTotalSpent(): number {
    return this.receipts.reduce((sum, r) => sum + r.amount, 0);
  }

  getSummary(): { total: number; count: number; byEndpoint: Record<string, number> } {
    const byEndpoint: Record<string, number> = {};
    for (const r of this.receipts) {
      byEndpoint[r.endpoint] = (byEndpoint[r.endpoint] || 0) + r.amount;
    }
    return {
      total: this.getTotalSpent(),
      count: this.receipts.length,
      byEndpoint,
    };
  }
}

// ============================================================
// STYX CLIENT
// ============================================================

export class StyxClient {
  private config: ClientConfig;
  private ledger: PaymentLedger;
  private httpClient: x402HTTPClient;

  constructor(config: ClientConfig) {
    this.config = config;
    this.ledger = new PaymentLedger();

    const account = privateKeyToAccount(config.wallet.privateKey);
    const coreClient = new x402Client();
    registerExactEvmScheme(coreClient, {
      signer: account,
      networks: [config.wallet.network],
    });
    this.httpClient = new x402HTTPClient(coreClient);
  }

  // --------------------------------------------------------
  // Core x402 Request Handler
  // --------------------------------------------------------

  private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<{ data: T; receipt: PaymentReceipt }> {
    const url = `${this.config.apiUrl}${endpoint}`;

    if (this.config.verbose) {
      console.log(`\nx402 Request: POST ${endpoint}`);
    }

    let response = await this.httpPost(url, body);

    if (response.status === 200) {
      const receipt = this.createReceipt(endpoint, 0, undefined, 'N/A');
      return { data: response.body as T, receipt };
    }

    if (response.status !== 402) {
      throw new Error(`Unexpected status ${response.status}: ${JSON.stringify(response.body)}`);
    }

    const paymentRequired = this.httpClient.getPaymentRequiredResponse(
      (name: string) => response.headers.get(name),
      response.body,
    );

    const accepted = paymentRequired.accepts?.[0];
    if (!accepted) {
      throw new Error('No payment options in 402 response');
    }

    const amountAtomic = BigInt(accepted.amount);
    const amount = Number(amountAtomic) / 1_000_000;

    if (this.config.verbose) {
      console.log(`  Payment required: $${amount.toFixed(2)} USDC`);
      console.log(`  Network: ${accepted.network}`);
      console.log(`  Pay to: ${accepted.payTo}`);
    }

    const paymentPayload = await this.httpClient.createPaymentPayload(paymentRequired);
    const paymentHeaders = this.httpClient.encodePaymentSignatureHeader(paymentPayload);

    response = await this.httpPost(url, body, paymentHeaders);

    if (response.status !== 200) {
      throw new Error(`Payment rejected (${response.status}): ${JSON.stringify(response.body)}`);
    }

    let txHash = '';
    try {
      const settleResponse = this.httpClient.getPaymentSettleResponse(
        (name: string) => response.headers.get(name),
      );
      txHash = settleResponse.transaction || '';
    } catch {
      // Settlement header may not be present in all configurations
    }

    const receipt = this.createReceipt(endpoint, amount, accepted.payTo, txHash);
    this.ledger.record(receipt);

    if (this.config.verbose) {
      console.log(`  Paid $${amount.toFixed(2)} USDC${txHash ? ` (tx: ${txHash.slice(0, 10)}...)` : ''}`);
    }

    return { data: response.body as T, receipt };
  }

  // --------------------------------------------------------
  // Compliance
  // --------------------------------------------------------

  async screenSanctions(params: {
    dealId?: string;
    buyerAddress: string;
    sellerAddress: string;
  }): Promise<{ data: SanctionsResponse; receipt: PaymentReceipt }> {
    return this.request<SanctionsResponse>('/api/v1/sanctions-screening', params);
  }

  async checkCompliance(params: {
    dealId?: string;
    state: string;
    propertyType?: string;
    purchasePrice?: number;
    buyerAddress: string;
    sellerAddress: string;
    buyerIsEntity?: boolean;
    sellerIsEntity?: boolean;
    buyerIsForeign?: boolean;
    sellerIsForeign?: boolean;
  }): Promise<{ data: ComplianceResponse; receipt: PaymentReceipt }> {
    return this.request<ComplianceResponse>('/api/v1/compliance-check', params);
  }

  async fullCompliance(params: {
    dealId?: string;
    state: string;
    propertyAddress?: string;
    purchasePrice?: number;
    buyerAddress: string;
    sellerAddress: string;
    buyerIsEntity?: boolean;
    sellerIsEntity?: boolean;
    buyerIsForeign?: boolean;
    sellerIsForeign?: boolean;
  }): Promise<{ data: ComplianceResponse; receipt: PaymentReceipt }> {
    return this.request<ComplianceResponse>('/api/v1/full-compliance', params);
  }

  async checkComplianceCommercial(params: {
    dealId?: string;
    state: string;
    propertyType?: string;
    purchasePrice?: number;
    buyerAddress: string;
    sellerAddress: string;
    buyerIsEntity?: boolean;
    sellerIsEntity?: boolean;
  }): Promise<{ data: ComplianceResponse; receipt: PaymentReceipt }> {
    return this.request<ComplianceResponse>('/api/v1/compliance-check-commercial', params as Record<string, unknown>);
  }

  async checkComplianceHighValue(params: {
    dealId?: string;
    state: string;
    propertyType?: string;
    purchasePrice: number;
    buyerAddress: string;
    sellerAddress: string;
    buyerIsEntity?: boolean;
    sellerIsEntity?: boolean;
  }): Promise<{ data: ComplianceResponse; receipt: PaymentReceipt }> {
    return this.request<ComplianceResponse>('/api/v1/compliance-check-high-value', params as Record<string, unknown>);
  }

  // --------------------------------------------------------
  // Legal, Brokerage, Lending
  // --------------------------------------------------------

  async checkLegal(params: {
    dealId?: string;
    state: string;
    purchasePrice?: number;
    closingDate?: string;
    propertyAddress?: string;
    propertyType?: string;
    isFinanced?: boolean;
    attorneys?: unknown[];
    providedDocuments?: string[];
    deedType?: string;
    signatureMethod?: string;
    isTokenizedTransaction?: boolean;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/legal/check', params as Record<string, unknown>);
  }

  async checkBrokerage(params: {
    dealId?: string;
    state: string;
    purchasePrice?: number;
    propertyAddress?: string;
    propertyType?: string;
    agents: unknown[];
    agencyRelationship: unknown;
    commission: unknown;
    providedDisclosures?: string[];
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/brokerage/check', params as Record<string, unknown>);
  }

  async prequalifyLending(params: {
    borrower: unknown;
    property: unknown;
    requestedLoanAmount: number;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/lending/prequalify', params as Record<string, unknown>);
  }

  // --------------------------------------------------------
  // KYC
  // --------------------------------------------------------

  async kycRiskAssessment(params: {
    dealId?: string;
    state: string;
    transaction: unknown;
    parties: unknown[];
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/kyc/risk-assessment', params as Record<string, unknown>);
  }

  async kycFullCheck(params: {
    dealId?: string;
    state: string;
    transaction: unknown;
    parties: unknown[];
    checksToRun: string[];
    existingCredentials?: string[];
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/kyc/check', params as Record<string, unknown>);
  }

  // --------------------------------------------------------
  // FIRPTA
  // --------------------------------------------------------

  async firptaDetermine(params: {
    dealId?: string;
    state: string;
    purchasePrice: number;
    sellerIsForeign: boolean;
    sellerType: string;
    buyerType: string;
    propertyUseIntent: string;
    propertyType: string;
    closingDate?: string;
    hasNonForeignAffidavit?: boolean;
    hasWithholdingCertificate?: boolean;
    estimatedGain?: number;
    is1031Exchange?: boolean;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/firpta/determine', params as Record<string, unknown>);
  }

  async firptaCalculate(params: {
    dealId?: string;
    state: string;
    purchasePrice: number;
    sellerIsForeign: boolean;
    sellerType: string;
    buyerType: string;
    propertyUseIntent: string;
    propertyType: string;
    propertyAddress?: string;
    sellerName?: string;
    sellerTIN?: string;
    buyerTIN?: string;
    county?: string;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/firpta/calculate', params as Record<string, unknown>);
  }

  // --------------------------------------------------------
  // ERC-3643
  // --------------------------------------------------------

  async issueClaims(params: {
    identityAddress: string;
    dealId: string;
    topics?: number[];
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/erc3643/issue-claims', params as Record<string, unknown>);
  }

  async verifyClaim(params: {
    identityAddress: string;
    topic: number;
    data: string;
    signature: string;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/erc3643/verify-claim', params as Record<string, unknown>);
  }

  // --------------------------------------------------------
  // Deal Pipeline
  // --------------------------------------------------------

  async createDeal(params: {
    buyerWallet: string;
    sellerWallet: string;
    property: {
      address?: string;
      city?: string;
      state: string;
      zipCode?: string;
      county?: string;
      propertyType?: string;
      parcelNumber?: string;
    };
    terms: {
      purchasePrice: number;
      earnestMoney?: number;
      closingDate?: string;
      financingType?: string;
      inspectionPeriodDays?: number;
    };
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/deal/create', params as Record<string, unknown>);
  }

  async advanceDeal(params: {
    dealId: string;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/deal/advance', params as Record<string, unknown>);
  }

  async closeDeal(params: {
    dealId: string;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/deal/close', params as Record<string, unknown>);
  }

  // --------------------------------------------------------
  // FinCEN RRE
  // --------------------------------------------------------

  async determineFinCEN(params: {
    dealId?: string;
    state: string;
    propertyType: string;
    financingType: string;
    buyerIsEntity?: boolean;
    buyerIsTrust?: boolean;
    closingDate?: string;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/fincen-rre/determine', params as Record<string, unknown>);
  }

  async generateFinCENReport(params: {
    dealId: string;
    closingDate: string;
    reportingPerson: unknown;
    transferee: unknown;
    transferor: unknown;
    property: unknown;
    consideration: unknown;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/fincen-rre/report', params as Record<string, unknown>);
  }

  async fileFinCEN(params: {
    dealId: string;
    closingDate: string;
    reportingPerson: unknown;
    transferee: unknown;
    transferor: unknown;
    property: unknown;
    consideration: unknown;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/fincen-rre/file', params as Record<string, unknown>);
  }

  async checkFinCENStatus(params: {
    bsaTrackingId: string;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/fincen-rre/status', params as Record<string, unknown>);
  }

  // --------------------------------------------------------
  // History & Attestations
  // --------------------------------------------------------

  async getWalletHistory(params: {
    walletAddress: string;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/history/wallet', params as Record<string, unknown>);
  }

  async getPropertyHistory(params: {
    propertyAddress: string;
    state: string;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/history/property', params as Record<string, unknown>);
  }

  async getEntityHistory(params: {
    entityIdentifier: string;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/history/entity', params as Record<string, unknown>);
  }

  async exploreAttestations(params: {
    propertyAddress?: string;
    city?: string;
    state?: string;
    dealId?: string;
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/attestations/explorer', params as Record<string, unknown>);
  }

  async auditDeal(params: {
    dealId: string;
    stages?: string[];
  }): Promise<{ data: unknown; receipt: PaymentReceipt }> {
    return this.request('/api/v1/deal-audit', params as Record<string, unknown>);
  }

  // --------------------------------------------------------
  // Discovery (free)
  // --------------------------------------------------------

  async getHealth(): Promise<unknown> {
    const response = await this.httpGet(`${this.config.apiUrl}/api/v1/health`);
    return response.body;
  }

  async getPricing(): Promise<unknown> {
    const response = await this.httpGet(`${this.config.apiUrl}/api/v1/pricing`);
    return response.body;
  }

  // --------------------------------------------------------
  // Ledger Access
  // --------------------------------------------------------

  getLedger(): PaymentLedger {
    return this.ledger;
  }

  getSpendingSummary(): ReturnType<PaymentLedger['getSummary']> {
    return this.ledger.getSummary();
  }

  // --------------------------------------------------------
  // Internals
  // --------------------------------------------------------

  private createReceipt(endpoint: string, amount: number, payTo: string | undefined, txHash: string): PaymentReceipt {
    return {
      receiptId: `RCP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      endpoint,
      amount,
      currency: 'USDC',
      network: this.config.wallet.network,
      txHash,
      paidAt: Date.now(),
      paidBy: this.config.wallet.address,
      paidTo: payTo || '',
    };
  }

  private async httpPost(
    url: string,
    body: Record<string, unknown>,
    extraHeaders: Record<string, string> = {}
  ): Promise<{ status: number; headers: Headers; body: unknown }> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': this.config.wallet.address,
          ...extraHeaders,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return { status: response.status, headers: response.headers, body: data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Request failed';
      throw new Error(`HTTP POST ${url} failed: ${message}`);
    }
  }

  private async httpGet(url: string): Promise<{ status: number; headers: Headers; body: unknown }> {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return { status: response.status, headers: response.headers, body: data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Request failed';
      throw new Error(`HTTP GET ${url} failed: ${message}`);
    }
  }
}

// ============================================================
// FACTORY
// ============================================================

export function createStyxClient(config: ClientConfig): StyxClient {
  return new StyxClient(config);
}
